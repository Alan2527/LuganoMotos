import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Payments } from "@/components/payments";
import { getProductBySlug } from "@/lib/catalog/queries";
import { discountPercent, formatPrice } from "@/lib/money";

type Params = { params: Promise<{ slug: string }> };

/** Necesario para el export estático: una página por producto. */
export async function generateStaticParams() {
  const products = await db.product.findMany({ select: { slug: true } });
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product?.name ?? "Producto",
    description: product?.shortDescription || product?.description?.slice(0, 150),
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const off = discountPercent(product.price, product.compareAtPrice);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <nav className="text-sm text-steel-400">
        <Link href="/" className="hover:text-white">
          Inicio
        </Link>{" "}
        /{" "}
        <Link href={`/categoria/${product.category.slug}`} className="hover:text-white">
          {product.category.name}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="cut-corner aspect-square overflow-hidden border border-carbon-800 bg-carbon-900">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-steel-400">Sin foto</div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {product.images.slice(1, 6).map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.id}
                  src={image.url}
                  alt={image.alt || product.name}
                  className="aspect-square border border-carbon-800 object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          {product.brand && (
            <span className="slant inline-block bg-race-500 px-3 py-1">
              <span className="race-label text-white">{product.brand}</span>
            </span>
          )}
          <h1 className="race-title mt-3 text-4xl text-white sm:text-5xl">{product.name}</h1>
          <p className="mt-1 text-xs text-steel-400">SKU {product.sku}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-5xl font-extrabold text-white tabular-nums">
              {formatPrice(product.price)}
            </span>
            {off && (
              <>
                <span className="text-lg text-steel-400 line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
                <span className="slant bg-race-500 px-2.5 py-1">
                  <span className="race-label text-white">{off}% off</span>
                </span>
              </>
            )}
          </div>

          <p className="mt-2 text-sm text-steel-400">
            {product.stock > 0 ? "Disponible — envío a todo el país" : "Sin stock — consultanos"}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={product.stock <= 0}
              className="slant bg-race-500 px-10 py-4 transition hover:bg-race-400 disabled:cursor-not-allowed disabled:bg-carbon-700"
            >
              <span className="race-label text-white">Agregar al carrito</span>
            </button>
            <a
              href={`https://wa.me/5491100000000?text=${encodeURIComponent(
                `Hola! Consulto por ${product.name} (SKU ${product.sku})`,
              )}`}
              className="slant border border-carbon-600 px-10 py-4 transition hover:border-race-500"
            >
              <span className="race-label text-white">Consultar</span>
            </a>
          </div>

          <div className="mt-8 border-t border-carbon-800 pt-6">
            <p className="race-label text-steel-400">Pagás con</p>
            <Payments className="mt-3" />
          </div>

          {product.fitments.length > 0 && (
            <section className="mt-10">
              <h2 className="race-label text-white">Compatible con</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.fitments.map((fit) => (
                  <li
                    key={fit.id}
                    className="slant border border-carbon-700 bg-carbon-900 px-3 py-1 text-sm text-steel-200"
                  >
                    {fit.brand} {fit.model}
                    {fit.yearFrom ? ` ${fit.yearFrom}${fit.yearTo ? `-${fit.yearTo}` : ""}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {product.description && (
            <section className="mt-10">
              <h2 className="race-label text-white">Descripción</h2>
              <p className="mt-3 whitespace-pre-line text-steel-400">{product.description}</p>
            </section>
          )}

          {product.listing?.permalink && (
            <p className="mt-8 text-xs text-steel-400">
              También publicado en{" "}
              <a href={product.listing.permalink} className="text-race-500 hover:underline">
                Mercado Libre
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
