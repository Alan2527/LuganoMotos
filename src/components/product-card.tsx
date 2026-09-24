import Link from "next/link";
import { discountPercent, formatPrice } from "@/lib/money";

export type ProductCardData = {
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: Array<{ url: string; alt: string }>;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const off = discountPercent(product.price, product.compareAtPrice);

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-carbon-800 bg-carbon-900 transition hover:border-ignition-500/60"
    >
      <div className="relative aspect-square overflow-hidden bg-carbon-800">
        {image ? (
          // Las fotos vienen del sitio viejo y de dominios externos: <img> evita
          // tener que whitelistear cada host en next.config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt || product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ash-400">
            Sin foto
          </div>
        )}

        {off && (
          <span className="absolute left-3 top-3 rounded bg-ignition-500 px-2 py-1 text-xs font-bold text-carbon-950">
            {off}% OFF
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute right-3 top-3 rounded bg-carbon-950/90 px-2 py-1 text-xs text-ash-400">
            Sin stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.brand && (
          <span className="text-xs uppercase tracking-wide text-ignition-500">{product.brand}</span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-white">{product.name}</h3>
        <div className="mt-auto pt-3">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <p className="text-xs text-ash-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </p>
          )}
          <p className="text-lg font-semibold text-white">{formatPrice(product.price)}</p>
        </div>
      </div>
    </Link>
  );
}
