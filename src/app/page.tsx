import Image from "next/image";
import Link from "next/link";
import { BrandWall } from "@/components/brand-wall";
import { Payments } from "@/components/payments";
import { ProductCard } from "@/components/product-card";
import { getCategories, getFeaturedProducts, getFitmentBrands } from "@/lib/catalog/queries";
import { db } from "@/lib/db";

export default async function HomePage() {
  const [categories, featured, brands, total] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getFitmentBrands(),
    db.product.count(),
  ]);

  const topCategories = [...categories]
    .sort((a, b) => b._count.products - a._count.products)
    .slice(0, 10);

  return (
    <>
      <Hero total={total} brands={brands} />
      <BrandWall />
      <Categories categories={topCategories} />
      <Featured products={featured} />
      <TrustBand />
    </>
  );
}

function Hero({ total, brands }: { total: number; brands: string[] }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-carbon-800">
      <Image
        src="/brand/local.webp"
        alt="Local de Lugano Motos en Av. Riestra"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center opacity-35"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-carbon-950 via-carbon-950/92 to-carbon-950/45" />
      <div className="speedlines absolute inset-0 -z-10" />

      <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
        <p className="race-label text-race-400">Villa Lugano · desde 1994</p>

        <h1 className="race-title mt-5 max-w-3xl text-6xl text-white sm:text-8xl">
          Tu moto no
          <br />
          espera. <span className="text-race-500">Nosotros</span>
          <br />
          tampoco.
        </h1>

        <p className="mt-7 max-w-lg text-lg text-steel-400">
          {total.toLocaleString("es-AR")} repuestos, accesorios y cascos en stock. Envíos a todo el
          país y retiro en el local.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/buscar" className="slant bg-race-500 px-8 py-4 transition hover:bg-race-400">
            <span className="race-label text-white">Ver catálogo</span>
          </Link>
          <a
            href="https://wa.me/5491100000000"
            className="slant border border-carbon-600 bg-carbon-900/80 px-8 py-4 transition hover:border-race-500"
          >
            <span className="race-label text-white">Consultar por WhatsApp</span>
          </a>
        </div>

        <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-px overflow-hidden border border-carbon-800 bg-carbon-800 sm:grid-cols-3">
          <Stat value={total.toLocaleString("es-AR")} label="Productos en stock" />
          <Stat value="9,6" label="Puntaje de clientes" />
          <Stat value="10 min" label="Respuesta por WhatsApp" wide />
        </dl>

        {brands.length > 0 && (
          <div className="mt-12">
            <p className="race-label text-steel-400">Buscá por tu moto</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {brands.slice(0, 10).map((brand) => (
                <Link
                  key={brand}
                  href={`/buscar?q=${encodeURIComponent(brand)}`}
                  className="slant border border-carbon-700 bg-carbon-900 px-4 py-2 transition hover:border-race-500 hover:bg-race-500"
                >
                  <span className="text-sm font-medium text-steel-200">{brand}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ value, label, wide = false }: { value: string; label: string; wide?: boolean }) {
  return (
    // En dos columnas el tercer dato ocupa la fila entera, para que no quede
    // un hueco al lado.
    <div className={`bg-carbon-950/85 px-5 py-6 ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <dt className="font-display text-4xl font-extrabold text-white tabular-nums">{value}</dt>
      <dd className="race-label mt-1 text-steel-400">{label}</dd>
    </div>
  );
}

type CategoryTile = { id: string; slug: string; name: string; _count: { products: number } };

function Categories({ categories }: { categories: CategoryTile[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="flex items-end justify-between gap-4">
        <h2 className="race-title text-4xl text-white sm:text-5xl">Por categoría</h2>
        <Link href="/buscar" className="race-label text-race-400 hover:underline">
          Ver todo
        </Link>
      </div>

      {/* Placas de número: la ficha de cada categoría es una plancha de motocross. */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={`/categoria/${category.slug}`}
            className="cut-corner group relative overflow-hidden border border-carbon-800 bg-carbon-900 p-5 transition hover:border-race-500"
          >
            <span className="race-title absolute -right-1 -top-3 text-6xl text-carbon-800 transition group-hover:text-race-600/40">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="relative font-display text-lg font-bold uppercase text-white">
              {category.name}
            </p>
            <p className="relative mt-1 text-xs text-steel-400">
              {category._count.products} productos
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

type FeaturedProduct = Parameters<typeof ProductCard>[0]["product"];

function Featured({ products }: { products: FeaturedProduct[] }) {
  if (products.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <p className="border border-dashed border-carbon-700 p-8 text-center text-steel-400">
          Todavía no hay productos cargados. Corré{" "}
          <code className="text-race-400">npm run import</code> para migrar el catálogo.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20">
      <div className="flex items-end justify-between gap-4">
        <h2 className="race-title text-4xl text-white sm:text-5xl">Últimos ingresos</h2>
        <Link href="/buscar" className="race-label text-race-400 hover:underline">
          Ver catálogo
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}

function TrustBand() {
  return (
    <section className="carbon border-y border-carbon-800">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:grid-cols-3">
        <div>
          <p className="race-label text-race-400">Envíos</p>
          <p className="mt-2 font-display text-2xl font-bold uppercase text-white">
            A todo el país
          </p>
          <p className="mt-1 text-sm text-steel-400">Seguimiento del envío desde la web.</p>
        </div>

        <div>
          <p className="race-label text-race-400">Retiro</p>
          <p className="mt-2 font-display text-2xl font-bold uppercase text-white">
            Av. Riestra 6251
          </p>
          <p className="mt-1 text-sm text-steel-400">Villa Lugano, CABA. Lunes a sábado.</p>
        </div>

        <div>
          <p className="race-label text-race-400">Pagás como quieras</p>
          <Payments className="mt-3" />
        </div>
      </div>
    </section>
  );
}
