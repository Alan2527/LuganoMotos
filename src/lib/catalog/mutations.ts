import { db } from "@/lib/db";
import { enqueue } from "@/lib/meli/queue";
import { slugify } from "./slug";

/** La publicación automática se puede apagar sin tocar código. */
export function autoPublishEnabled(): boolean {
  return process.env.MELI_AUTO_PUBLISH !== "false";
}

export type NewProductInput = {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  brand?: string;
  model?: string;
  partNumber?: string;
  warrantyMonths?: number;
  images?: Array<{ url: string; alt?: string }>;
  fitments?: Array<{ brand: string; model: string; yearFrom?: number; yearTo?: number }>;
};

/**
 * Alta de producto. Este es el punto que pedía el cliente: todo lo que se sube
 * a la web queda encolado para publicarse en Mercado Libre, sin pasos manuales.
 * Si el producto no cumple los requisitos de ML, el job falla con el motivo y
 * queda visible en el panel — nunca se publica algo incompleto.
 */
export async function createProduct(input: NewProductInput) {
  const product = await db.product.create({
    data: {
      sku: input.sku,
      slug: slugify(input.name),
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      categoryId: input.categoryId,
      brand: input.brand,
      model: input.model,
      partNumber: input.partNumber,
      warrantyMonths: input.warrantyMonths,
      images: {
        create: (input.images ?? []).map((image, position) => ({
          url: image.url,
          alt: image.alt ?? input.name,
          position,
        })),
      },
      fitments: { create: input.fitments ?? [] },
    },
  });

  if (autoPublishEnabled()) await enqueue("publish", product.id);

  return product;
}

/** Cambios de precio o stock se propagan a la publicación existente. */
export async function updateProduct(productId: string, data: { price?: number; stock?: number; active?: boolean }) {
  const product = await db.product.update({ where: { id: productId }, data });

  const listing = await db.meliListing.findUnique({ where: { productId } });
  if (listing?.meliItemId) await enqueue("sync", productId);

  return product;
}
