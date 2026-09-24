import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCategories, getFeaturedProducts, getFitmentBrands } from "@/lib/catalog/queries";

export default async function HomePage() {
  const [categories, featured, brands] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getFitmentBrands(),
  ]);

  return (
    <>
      <section className="bg-grid border-b border-carbon-800">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ignition-500">
            Repuestos y accesorios
          </p>
          <h1 className="headline mt-4 max-w-3xl text-5xl leading-[0.95] text-white sm:text-7xl">
            Todo para tu moto,
            <br />
            <span className="text-ignition-500">sin vueltas.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ash-400">
            Más de 30 años sobre dos ruedas en Villa Lugano. Envíos a todo el país y retiro en el
            local.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/buscar?q="
              className="rounded-full bg-ignition-500 px-6 py-3 font-semibold text-carbon-950 transition hover:bg-ignition-400"
            >
              Ver catálogo
            </Link>
            <a
              href="https://wa.me/5491100000000"
              className="rounded-full border border-carbon-700 px-6 py-3 font-semibold text-white transition hover:border-ignition-500"
            >
              Consultar por WhatsApp
            </a>
          </div>

          {brands.length > 0 && (
            <div className="mt-12">
              <p className="text-sm font-semibold text-white">Buscá por tu moto</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {brands.slice(0, 10).map((brand) => (
                  <Link
                    key={brand}
                    href={`/buscar?q=${encodeURIComponent(brand)}`}
                    className="rounded-full border border-carbon-700 bg-carbon-900 px-4 py-2 text-sm text-ash-200 transition hover:border-ignition-500"
                  >
                    {brand}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="headline text-2xl text-white">Categorías</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categoria/${category.slug}`}
              className="rounded-xl border border-carbon-800 bg-carbon-900 p-5 transition hover:border-ignition-500/60"
            >
              <p className="font-medium text-white">{category.name}</p>
              <p className="mt-1 text-xs text-ash-400">{category._count.products} productos</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="headline text-2xl text-white">Novedades</h2>
          <Link href="/buscar?q=" className="text-sm text-ignition-500 hover:underline">
            Ver todo
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>

        {featured.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-carbon-700 p-8 text-center text-ash-400">
            Todavía no hay productos cargados. Corré{" "}
            <code className="text-ignition-500">npm run import</code> para migrar el catálogo actual.
          </p>
        )}
      </section>
    </>
  );
}
