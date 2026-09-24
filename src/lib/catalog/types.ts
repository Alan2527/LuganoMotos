/** Producto normalizado, independiente de cómo se haya extraído del sitio viejo. */
export type LegacyProduct = {
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  brand?: string;
  categoryName: string;
  categorySlug: string;
  images: string[];
  legacyUrl?: string;
};

export type ImportReport = {
  strategy: string;
  found: number;
  imported: number;
  skipped: Array<{ name: string; reason: string }>;
};
