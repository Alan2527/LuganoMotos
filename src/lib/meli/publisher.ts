import { db } from "@/lib/db";
import { calculateMeliPrice, DEFAULT_PRICING } from "@/lib/pricing";
import { meliFetch, MeliApiError } from "./client";
import { getRequiredAttributes, predictCategory } from "./categories";
import { buildDescription, buildItemPayload, buildTitle, type ProductForMeli } from "./mapper";

const PRODUCT_INCLUDE = {
  images: true,
  fitments: true,
  category: { select: { name: true, meliCategoryId: true } },
} as const;

export type Blocker = { field: string; message: string };

/**
 * Chequeos previos a publicar. Publicar 500 ítems con datos incompletos es la
 * forma más rápida de que ML baje las publicaciones y penalice la cuenta, así
 * que nada sale sin pasar por acá.
 */
export function validateForPublish(product: ProductForMeli): Blocker[] {
  const blockers: Blocker[] = [];
  const usable = product.images.filter((image) => image.meliSafe);

  if (usable.length === 0) {
    blockers.push({
      field: "images",
      message: "No hay fotos aptas: ML rechaza imágenes con logos, textos o marcas de agua.",
    });
  }
  if (!product.brand && !process.env.MELI_DEFAULT_BRAND) {
    blockers.push({
      field: "brand",
      message: "Falta la marca (atributo obligatorio en ML). Definí MELI_DEFAULT_BRAND para los repuestos sin marca.",
    });
  }
  if (product.price <= 0) {
    blockers.push({ field: "price", message: "El producto no tiene precio cargado." });
  }
  if (product.stock <= 0) {
    blockers.push({ field: "stock", message: "Sin stock: la publicación quedaría pausada." });
  }
  if (buildDescription(product).length < 30) {
    blockers.push({
      field: "description",
      message: "La descripción es demasiado corta para publicar.",
    });
  }
  if (buildTitle(product).length < 10) {
    blockers.push({ field: "title", message: "El título resultante es demasiado corto." });
  }

  return blockers;
}

export async function getProductForMeli(productId: string): Promise<ProductForMeli> {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: PRODUCT_INCLUDE,
  });
  if (!product) throw new Error(`No existe el producto ${productId}`);
  return product;
}

/** Resuelve la categoría de ML: la de la categoría propia, o la predicha por título. */
export async function resolveCategoryId(product: ProductForMeli): Promise<string> {
  if (product.category.meliCategoryId) return product.category.meliCategoryId;

  const predicted = await predictCategory(buildTitle(product));
  if (!predicted) {
    throw new Error(
      `No se pudo predecir la categoría de ML para "${product.name}". Cargala a mano en la categoría.`,
    );
  }
  return predicted.category_id;
}

/**
 * Publica el producto en Mercado Libre y guarda el mapeo.
 * Idempotente: si ya existe una publicación activa, actualiza en vez de duplicar.
 */
export async function publishProduct(productId: string) {
  const product = await getProductForMeli(productId);

  const existing = await db.meliListing.findUnique({ where: { productId } });
  if (existing?.meliItemId) {
    return syncListing(productId);
  }

  const blockers = validateForPublish(product);
  if (blockers.length > 0) {
    await recordError(productId, blockers.map((b) => b.message).join(" "));
    return { ok: false as const, blockers };
  }

  const categoryId = await resolveCategoryId(product);
  const required = await getRequiredAttributes(categoryId);
  const payload = buildItemPayload(product, { categoryId });

  const missing = required.filter(
    (attr) => !payload.attributes.some((candidate) => candidate.id === attr.id),
  );
  if (missing.length > 0) {
    const message = `Faltan atributos obligatorios de la categoría ${categoryId}: ${missing
      .map((attr) => attr.name)
      .join(", ")}`;
    await recordError(productId, message);
    return { ok: false as const, blockers: [{ field: "attributes", message }] };
  }

  try {
    const item = await meliFetch<{ id: string; permalink: string; status: string }>("/items", {
      method: "POST",
      body: payload,
    });

    // La descripción va en un recurso aparte, después de crear el ítem.
    await meliFetch(`/items/${item.id}/description`, {
      method: "POST",
      body: { plain_text: buildDescription(product) },
    });

    await db.meliListing.upsert({
      where: { productId },
      create: {
        productId,
        meliItemId: item.id,
        permalink: item.permalink,
        status: item.status,
        categoryId,
        publishedPrice: payload.price,
        publishedStock: payload.available_quantity,
        lastSyncedAt: new Date(),
      },
      update: {
        meliItemId: item.id,
        permalink: item.permalink,
        status: item.status,
        categoryId,
        publishedPrice: payload.price,
        publishedStock: payload.available_quantity,
        lastError: null,
        lastSyncedAt: new Date(),
      },
    });

    return { ok: true as const, itemId: item.id, permalink: item.permalink };
  } catch (error) {
    const message = error instanceof MeliApiError ? error.message : String(error);
    await recordError(productId, message);
    throw error;
  }
}

/** Empuja precio y stock actuales a la publicación existente. */
export async function syncListing(productId: string) {
  const product = await getProductForMeli(productId);
  const listing = await db.meliListing.findUnique({ where: { productId } });
  if (!listing?.meliItemId) throw new Error(`El producto ${productId} no está publicado en ML.`);

  const { meliPrice } = calculateMeliPrice(product.price, DEFAULT_PRICING);
  const quantity = Math.max(product.stock, 0);

  await meliFetch(`/items/${listing.meliItemId}`, {
    method: "PUT",
    body: {
      price: meliPrice,
      available_quantity: quantity,
      status: quantity > 0 && product.active ? "active" : "paused",
    },
  });

  await db.meliListing.update({
    where: { productId },
    data: {
      publishedPrice: meliPrice,
      publishedStock: quantity,
      status: quantity > 0 && product.active ? "active" : "paused",
      lastError: null,
      lastSyncedAt: new Date(),
    },
  });

  return { ok: true as const, itemId: listing.meliItemId, price: meliPrice, stock: quantity };
}

async function recordError(productId: string, message: string) {
  await db.meliListing.upsert({
    where: { productId },
    create: { productId, status: "error", lastError: message.slice(0, 1000) },
    update: { status: "error", lastError: message.slice(0, 1000) },
  });
}
