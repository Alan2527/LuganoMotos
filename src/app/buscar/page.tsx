import { Suspense } from "react";
import { SearchResults } from "@/components/search-results";

export const metadata = { title: "Buscar" };

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Suspense fallback={<p className="text-steel-400">Cargando catálogo…</p>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
