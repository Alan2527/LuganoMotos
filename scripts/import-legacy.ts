/**
 * Migración del catálogo del sitio viejo al nuevo.
 *
 *   npm run import -- --limit 20 --dry-run
 *   npm run import -- --base-url https://luganomotos.com.ar
 *
 * Respeta fotos, descripciones y precios tal como están hoy: no inventa datos.
 * Lo que falta (marca, código de parte, compatibilidades) queda vacío y se
 * reporta, porque es exactamente lo que Mercado Libre va a exigir después.
 *
 * Además deja el catálogo crudo en `data/legacy-catalog.json`, que se versiona
 * y sirve de respaldo: `npm run seed` reconstruye la base desde ahí cuando el
 * sitio viejo no responde.
 */
import "./proxy-bootstrap";
import { mkdir, writeFile } from "node:fs/promises";
import { db } from "../src/lib/db";
import { scrapeCatalog } from "../src/lib/catalog/scrape";
import { persistCatalog, printGaps, writeSearchIndex } from "../src/lib/catalog/persist";
import type { LegacyProduct } from "../src/lib/catalog/types";

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const flags = {
  baseUrl: (arg("base-url") ?? "https://luganomotos.com.ar").replace(/\/$/, ""),
  limit: arg("limit") ? Number(arg("limit")) : undefined,
  dryRun: process.argv.includes("--dry-run"),
};

async function main() {
  console.log(`Extrayendo catálogo de ${flags.baseUrl}...`);

  const { strategy, products } = await scrapeCatalog({
    baseUrl: flags.baseUrl,
    consumerKey: process.env.WC_CONSUMER_KEY,
    consumerSecret: process.env.WC_CONSUMER_SECRET,
    limit: flags.limit,
  });

  console.log(`Estrategia: ${strategy} — ${products.length} productos encontrados.`);

  await mkdir("data", { recursive: true });
  await writeFile("data/legacy-catalog.json", JSON.stringify(products));

  if (flags.dryRun) {
    console.log("Dry run: no se escribió nada en la base.");
    console.table(products.slice(0, 10).map(summarize));
  } else {
    const report = await persistCatalog(products, strategy);
    await writeFile("data/import-report.json", JSON.stringify(report, null, 2));
    console.log(`Importados ${report.imported} productos, ${report.skipped.length} salteados.`);
    await writeSearchIndex();
  }

  printGaps(products);
}

function summarize(product: LegacyProduct) {
  return {
    sku: product.sku,
    nombre: product.name.slice(0, 40),
    precio: product.price,
    fotos: product.images.length,
    categoria: product.categorySlug,
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
