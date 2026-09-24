import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { getCategoryWithProducts } from "@/lib/catalog/queries";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const category = await getCategoryWithProducts(slug);
  return { title: category?.name ?? "Categoría" };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = await getCategoryWithProducts(slug);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="headline text-3xl text-white">{category.name}</h1>
      <p className="mt-2 text-sm text-ash-400">{category.products.length} productos</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {category.products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
