import { db } from "@/lib/db";

const CARD_SELECT = {
  slug: true,
  name: true,
  brand: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  images: {
    select: { url: true, alt: true },
    orderBy: { position: "asc" },
    take: 1,
  },
} as const;

export async function getCategories() {
  return db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getFeaturedProducts(take = 8) {
  return db.product.findMany({
    where: { active: true, stock: { gt: 0 } },
    orderBy: { updatedAt: "desc" },
    take,
    select: CARD_SELECT,
  });
}

export async function getCategoryWithProducts(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { active: true },
        orderBy: [{ stock: "desc" }, { name: "asc" }],
        select: CARD_SELECT,
      },
    },
  });
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      fitments: { orderBy: [{ brand: "asc" }, { model: "asc" }] },
      category: true,
      listing: true,
    },
  });
}

export async function searchProducts(query: string) {
  const term = query.trim();
  if (!term) return [];

  return db.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: term } },
        { brand: { contains: term } },
        { model: { contains: term } },
        { sku: { contains: term } },
        { fitments: { some: { model: { contains: term } } } },
      ],
    },
    take: 60,
    orderBy: { stock: "desc" },
    select: CARD_SELECT,
  });
}

/** Marcas de moto cargadas en compatibilidades, para el buscador "por tu moto". */
export async function getFitmentBrands() {
  const rows = await db.fitment.groupBy({ by: ["brand"], _count: true });
  return rows.sort((a, b) => b._count - a._count).map((row) => row.brand);
}
