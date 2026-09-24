import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/catalog/queries";
import { discountPercent, formatPrice } from "@/lib/money";

type Params = { params: Promise<{ slug: string }> };

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
      <nav className="text-sm text-ash-400">
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
          <div className="aspect-square overflow-hidden rounded-xl border border-carbon-800 bg-carbon-900">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].alt || product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-ash-400">Sin foto</div>
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
                  className="aspect-square rounded-lg border border-carbon-800 object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          {product.brand && (
            <p className="text-sm uppercase tracking-wide text-ignition-500">{product.brand}</p>
          )}
          <h1 className="mt-2 text-3xl font-semibold text-white">{product.name}</h1>
          <p className="mt-1 text-xs text-ash-400">SKU {product.sku}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-4xl font-bold text-white">{formatPrice(product.price)}</span>
            {off && (
              <>
                <span className="text-lg text-ash-400 line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
                <span className="rounded bg-ignition-500 px-2 py-1 text-xs font-bold text-carbon-950">
                  {off}% OFF
                </span>
              </>
            )}
          </div>

          <p className="mt-2 text-sm text-ash-400">
            {product.stock > 0 ? "Disponible — envío a todo el país" : "Sin stock — consultanos"}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={product.stock <= 0}
              className="rounded-full bg-ignition-500 px-8 py-3 font-semibold text-carbon-950 transition hover:bg-ignition-400 disabled:cursor-not-allowed disabled:bg-carbon-700 disabled:text-ash-400"
            >
              Agregar al carrito
            </button>
            <a
              href={`https://wa.me/5491100000000?text=${encodeURIComponent(
                `Hola! Consulto por ${product.name} (SKU ${product.sku})`,
              )}`}
              className="rounded-full border border-carbon-700 px-8 py-3 font-semibold text-white transition hover:border-ignition-500"
            >
              Consultar
            </a>
          </div>

          {product.fitments.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Compatible con
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.fitments.map((fit) => (
                  <li
                    key={fit.id}
                    className="rounded-full border border-carbon-700 bg-carbon-900 px-3 py-1 text-sm text-ash-200"
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
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Descripción
              </h2>
              <p className="mt-3 whitespace-pre-line text-ash-400">{product.description}</p>
            </section>
          )}

          {product.listing?.permalink && (
            <p className="mt-8 text-xs text-ash-400">
              También publicado en{" "}
              <a href={product.listing.permalink} className="text-ignition-500 hover:underline">
                Mercado Libre
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
