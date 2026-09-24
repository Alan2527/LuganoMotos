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
      className="cut-corner group relative flex flex-col border border-carbon-800 bg-carbon-900 transition hover:border-race-500"
    >
      {/* Tira roja que se llena al pasar por encima, como una línea de meta. */}
      <span className="absolute inset-x-0 top-0 z-10 h-0.5 w-0 bg-race-500 transition-all duration-300 group-hover:w-full" />

      <div className="relative aspect-square overflow-hidden bg-carbon-800">
        {image ? (
          // Las fotos son del sitio del cliente, en dominio propio: <img> evita
          // configurar cada host remoto en next.config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt || product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="carbon flex h-full items-center justify-center">
            <span className="race-label text-carbon-600">Lugano Motos</span>
          </div>
        )}

        {off && (
          <span className="slant absolute left-3 top-3 bg-race-500 px-2.5 py-1">
            <span className="race-label text-white">{off}% off</span>
          </span>
        )}
        {product.stock <= 0 && (
          <span className="slant absolute right-3 top-3 bg-carbon-950/90 px-2.5 py-1">
            <span className="race-label text-steel-400">Sin stock</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.brand && (
          <span className="race-label text-race-400">{product.brand}</span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-white">{product.name}</h3>

        <div className="mt-auto pt-3">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <p className="text-xs text-steel-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </p>
          )}
          <p className="font-display text-2xl font-extrabold tracking-tight text-white">{formatPrice(product.price)}</p>
        </div>
      </div>
    </Link>
  );
}
