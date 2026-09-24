import type { Fitment, Product, ProductImage } from "@prisma/client";
import { MELI } from "./config";
import { calculateMeliPrice, DEFAULT_PRICING, type MeliPricingConfig } from "@/lib/pricing";

export type ProductForMeli = Product & {
  images: ProductImage[];
  fitments: Fitment[];
  category: { name: string; meliCategoryId: string | null };
};

export type MeliItemPayload = {
  title: string;
  category_id: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  buying_mode: "buy_it_now";
  condition: "new" | "used";
  listing_type_id: string;
  pictures: Array<{ source: string }>;
  attributes: Array<{ id: string; value_name: string }>;
  sale_terms: Array<{ id: string; value_name: string }>;
  shipping: {
    mode: "me2";
    local_pick_up: boolean;
    free_shipping: boolean;
  };
};

/**
 * Título con el formato que ML premia y modera: Producto + Marca + Modelo +
 * especificación. Sin mayúsculas gritadas, sin precios, sin "OFERTA", sin
 * datos de contacto — todo eso es motivo de baja de la publicación.
 */
export function buildTitle(product: ProductForMeli): string {
  const parts = [product.name, product.brand, product.model, product.partNumber]
    .filter((part): part is string => Boolean(part && part.trim()))
    .map((part) => part.trim());

  const seen = new Set<string>();
  const unique = parts.filter((part) => {
    const key = part.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.join(" ").replace(/\s+/g, " ").slice(0, 60);
}

/** Descripción en texto plano: ML dejó de aceptar HTML en `plain_text`. */
export function buildDescription(product: ProductForMeli): string {
  const blocks = [product.description || product.shortDescription];

  if (product.fitments.length > 0) {
    const lines = product.fitments.map((fit) => {
      const years = [fit.yearFrom, fit.yearTo].filter(Boolean).join(" a ");
      return `- ${fit.brand} ${fit.model}${years ? ` (${years})` : ""}`;
    });
    blocks.push(`Compatibilidades:\n${lines.join("\n")}`);
  }

  if (product.partNumber) blocks.push(`Código de parte: ${product.partNumber}`);

  return blocks
    .filter(Boolean)
    .join("\n\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function buildItemPayload(
  product: ProductForMeli,
  options: {
    categoryId: string;
    listingTypeId?: string;
    pricing?: MeliPricingConfig;
    /** Atributos obligatorios ya resueltos para esa categoría. */
    extraAttributes?: Array<{ id: string; value_name: string }>;
  },
): MeliItemPayload {
  const pricing = options.pricing ?? DEFAULT_PRICING;
  const { meliPrice } = calculateMeliPrice(product.price, pricing);

  const attributes: Array<{ id: string; value_name: string }> = [];
  const brand = product.brand ?? process.env.MELI_DEFAULT_BRAND;
  if (brand) attributes.push({ id: "BRAND", value_name: brand });
  if (product.model) attributes.push({ id: "MODEL", value_name: product.model });
  if (product.partNumber) {
    attributes.push({ id: "PART_NUMBER", value_name: product.partNumber });
  }
  attributes.push({ id: "SELLER_SKU", value_name: product.sku });
  for (const extra of options.extraAttributes ?? []) {
    if (!attributes.some((attr) => attr.id === extra.id)) attributes.push(extra);
  }

  const saleTerms: Array<{ id: string; value_name: string }> = [];
  if (product.warrantyMonths) {
    saleTerms.push({ id: "WARRANTY_TYPE", value_name: "Garantía del vendedor" });
    saleTerms.push({
      id: "WARRANTY_TIME",
      value_name: `${product.warrantyMonths} meses`,
    });
  } else {
    saleTerms.push({ id: "WARRANTY_TYPE", value_name: "Sin garantía" });
  }

  return {
    title: buildTitle(product),
    category_id: options.categoryId,
    price: meliPrice,
    currency_id: MELI.currency,
    available_quantity: Math.max(product.stock, 0),
    buying_mode: "buy_it_now",
    condition: product.condition === "used" ? "used" : "new",
    listing_type_id: options.listingTypeId ?? "gold_special",
    pictures: product.images
      .filter((image) => image.meliSafe)
      .sort((a, b) => a.position - b.position)
      .slice(0, 10)
      .map((image) => ({ source: image.url })),
    attributes,
    sale_terms: saleTerms,
    shipping: {
      mode: "me2",
      local_pick_up: true,
      free_shipping: meliPrice >= pricing.freeShippingThreshold,
    },
  };
}
