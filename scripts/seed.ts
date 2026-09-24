/**
 * Reconstruye la base desde el snapshot versionado del catálogo.
 *
 *   npm run seed
 *
 * Se usa cuando el sitio viejo no está disponible —los runners de GitHub no
 * siempre pueden alcanzarlo— para que el deploy de la demo no dependa de un
 * servidor ajeno.
 */
import { readFile } from "node:fs/promises";
import { db } from "../src/lib/db";
import { persistCatalog, printGaps, writeSearchIndex } from "../src/lib/catalog/persist";
import type { LegacyProduct } from "../src/lib/catalog/types";

async function main() {
  const raw = await readFile("data/legacy-catalog.json", "utf8");
  const products = JSON.parse(raw) as LegacyProduct[];

  console.log(`Cargando snapshot: ${products.length} productos.`);

  const report = await persistCatalog(products, "snapshot");
  console.log(`Cargados ${report.imported}, salteados ${report.skipped.length}.`);

  await writeSearchIndex();
  printGaps(products);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
