import { db } from "@/lib/db";
import { PublishButton } from "@/components/publish-button";
import { validateForPublish } from "@/lib/meli/publisher";
import type { ProductForMeli } from "@/lib/meli/mapper";
import { autoPublishEnabled } from "@/lib/catalog/mutations";
import { calculateMeliPrice } from "@/lib/pricing";
import { formatPrice } from "@/lib/money";

export const metadata = { title: "Panel — Mercado Libre" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const products = (await db.product.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      images: true,
      fitments: true,
      category: { select: { name: true, meliCategoryId: true } },
      listing: true,
    },
  })) as Array<ProductForMeli & { listing: { status: string; permalink: string | null; lastError: string | null } | null }>;

  const [total, conFoto, publicados, conCuenta] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { images: { some: {} } } }),
    db.meliListing.count({ where: { status: "active" } }),
    db.meliAccount.count(),
  ]);

  const listos = products.filter((product) => validateForPublish(product).length === 0).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="race-title text-3xl text-white">Panel de publicación</h1>
          <p className="mt-2 text-sm text-steel-400">
            Publicación automática:{" "}
            <span className={autoPublishEnabled() ? "text-race-500" : "text-steel-400"}>
              {autoPublishEnabled() ? "activada" : "desactivada"}
            </span>{" "}
            · Cuenta de ML: {conCuenta > 0 ? "vinculada" : "sin vincular"}
          </p>
        </div>

        {conCuenta === 0 && (
          <a
            href="/api/meli/auth"
            className="rounded-full bg-race-500 px-5 py-2.5 text-sm font-semibold text-carbon-950"
          >
            Vincular Mercado Libre
          </a>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Productos" value={total} />
        <Stat label="Con foto" value={conFoto} hint="ML no publica sin foto" />
        <Stat label="Listos para publicar" value={listos} hint="de los últimos 200" />
        <Stat label="Publicados en ML" value={publicados} />
      </div>

      <table className="mt-10 w-full text-left text-sm">
        <thead className="border-b border-carbon-800 text-xs uppercase tracking-wide text-steel-400">
          <tr>
            <th className="py-3 pr-4">Producto</th>
            <th className="py-3 pr-4">Precio web</th>
            <th className="py-3 pr-4">Precio ML</th>
            <th className="py-3 pr-4">Estado</th>
            <th className="py-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const blockers = validateForPublish(product);
            const { meliPrice } = calculateMeliPrice(product.price);

            return (
              <tr key={product.id} className="border-b border-carbon-800/60 align-top">
                <td className="py-4 pr-4">
                  <p className="font-medium text-white">{product.name}</p>
                  <p className="text-xs text-steel-400">
                    {product.category.name} · {product.brand ?? "sin marca"} · stock {product.stock}
                  </p>
                </td>
                <td className="py-4 pr-4 text-steel-200">{formatPrice(product.price)}</td>
                <td className="py-4 pr-4 text-steel-200">
                  {formatPrice(meliPrice)}
                  <span className="block text-xs text-steel-400">con comisiones</span>
                </td>
                <td className="py-4 pr-4">
                  {product.listing?.permalink ? (
                    <a href={product.listing.permalink} className="text-race-500 hover:underline">
                      {product.listing.status}
                    </a>
                  ) : blockers.length > 0 ? (
                    <ul className="space-y-1 text-xs text-red-400">
                      {blockers.map((blocker) => (
                        <li key={blocker.field}>{blocker.message}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-steel-400">listo</span>
                  )}
                  {product.listing?.lastError && (
                    <p className="mt-1 text-xs text-red-400">{product.listing.lastError}</p>
                  )}
                </td>
                <td className="py-4">
                  {blockers.length === 0 && !product.listing?.permalink && (
                    <PublishButton productId={product.id} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-carbon-800 bg-carbon-900 p-5">
      <p className="text-3xl font-semibold text-white">{value.toLocaleString("es-AR")}</p>
      <p className="mt-1 text-sm text-steel-200">{label}</p>
      {hint && <p className="text-xs text-steel-400">{hint}</p>}
    </div>
  );
}
