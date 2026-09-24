import { ProductCard } from "@/components/product-card";
import { getFeaturedProducts, searchProducts } from "@/lib/catalog/queries";

type Props = { searchParams: Promise<{ q?: string }> };

export const metadata = { title: "Buscar" };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchProducts(q) : await getFeaturedProducts(60);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="headline text-3xl text-white">
        {q.trim() ? `Resultados para "${q}"` : "Catálogo"}
      </h1>
      <p className="mt-2 text-sm text-ash-400">{results.length} productos</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      {results.length === 0 && (
        <p className="mt-8 text-ash-400">
          No encontramos nada con ese término. Escribinos por WhatsApp: tenemos más productos de los
          que están publicados.
        </p>
      )}
    </div>
  );
}
