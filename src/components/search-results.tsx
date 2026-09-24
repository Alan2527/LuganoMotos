"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard, type ProductCardData } from "./product-card";

/** Cada entrada del índice generado por `npm run import`. */
type IndexEntry = {
  s: string;
  n: string;
  b: string | null;
  p: number;
  c: number | null;
  k: number;
  g: string;
  i: string | null;
  f: string[];
};

const PAGE_SIZE = 48;

export function SearchResults() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";

  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    fetch(`${base}/search-index.json`)
      .then((res) => res.json())
      .then(setIndex)
      .catch(() => setIndex([]));
  }, []);

  useEffect(() => setVisible(PAGE_SIZE), [query]);

  const results = useMemo(() => {
    if (!index) return [];
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return index;

    return index.filter((entry) => {
      const haystack = normalize(
        [entry.n, entry.b, entry.g, entry.f.join(" ")].filter(Boolean).join(" "),
      );
      return terms.every((term) => haystack.includes(term));
    });
  }, [index, query]);

  if (!index) {
    return <p className="text-ash-400">Cargando catálogo…</p>;
  }

  return (
    <>
      <h1 className="headline text-3xl text-white">
        {query.trim() ? `Resultados para "${query}"` : "Catálogo"}
      </h1>
      <p className="mt-2 text-sm text-ash-400">
        {results.length.toLocaleString("es-AR")} productos
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {results.slice(0, visible).map((entry) => (
          <ProductCard key={entry.s} product={toCardData(entry)} />
        ))}
      </div>

      {results.length > visible && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setVisible((current) => current + PAGE_SIZE)}
            className="rounded-full border border-carbon-700 px-6 py-3 font-semibold text-white transition hover:border-ignition-500"
          >
            Ver más productos
          </button>
        </div>
      )}

      {results.length === 0 && (
        <p className="mt-8 text-ash-400">
          No encontramos nada con ese término. Escribinos por WhatsApp: tenemos más productos de los
          que están publicados.
        </p>
      )}
    </>
  );
}

function toCardData(entry: IndexEntry): ProductCardData {
  return {
    slug: entry.s,
    name: entry.n,
    brand: entry.b,
    price: entry.p,
    compareAtPrice: entry.c,
    stock: entry.k,
    images: entry.i ? [{ url: entry.i, alt: entry.n }] : [],
  };
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
