/**
 * Migración del catálogo del sitio viejo al nuevo.
 *
 *   npm run import -- --limit 20 --dry-run
 *   npm run import -- --base-url https://luganomotos.com.ar
 *
 * Respeta fotos, descripciones y precios tal como están hoy: no inventa datos.
 * Lo que falta (marca, código de parte, compatibilidades) queda vacío y se
 * reporta, porque es exactamente lo que Mercado Libre va a exigir después.
 */
import "./proxy-bootstrap";
import { mkdir, writeFile } from "node:fs/promises";
import { db } from "../src/lib/db";
import { scrapeCatalog } from "../src/lib/catalog/scrape";
import { slugify } from "../src/lib/catalog/slug";
import { cleanProductName, detectFitments, resolveBrand } from "../src/lib/catalog/enrich";
import type { ImportReport, LegacyProduct } from "../src/lib/catalog/types";

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
  await writeFile("data/legacy-catalog.json", JSON.stringify(products, null, 2));

  const report: ImportReport = { strategy, found: products.length, imported: 0, skipped: [] };

  if (flags.dryRun) {
    console.log("Dry run: no se escribió nada en la base.");
    console.table(products.slice(0, 10).map(summarize));
  } else {
    for (const product of products) {
      const reason = reject(product);
      if (reason) {
        report.skipped.push({ name: product.name, reason });
        continue;
      }
      await upsertProduct(product);
      report.imported += 1;
    }
    console.log(`Importados ${report.imported} productos, ${report.skipped.length} salteados.`);
  }

  await writeFile("data/import-report.json", JSON.stringify(report, null, 2));
  if (!flags.dryRun) await writeSearchIndex();
  printGaps(products);
}

/**
 * Índice para el buscador. El catálogo entra entero en el cliente: son ~2.400
 * productos, la búsqueda sale instantánea y el sitio funciona igual servido
 * como estático (GitHub Pages) que con servidor.
 */
async function writeSearchIndex() {
  const products = await db.product.findMany({
    where: { active: true },
    orderBy: [{ stock: "desc" }, { name: "asc" }],
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      fitments: { select: { brand: true, model: true } },
      category: { select: { name: true, slug: true } },
    },
  });

  const index = products.map((product) => ({
    s: product.slug,
    n: product.name,
    b: product.brand,
    p: product.price,
    c: product.compareAtPrice,
    k: product.stock,
    g: product.category.name,
    i: product.images[0]?.url ?? null,
    f: product.fitments.map((fitment) => `${fitment.brand} ${fitment.model}`),
  }));

  await writeFile("public/search-index.json", JSON.stringify(index));
  console.log(`Índice de búsqueda: ${index.length} productos.`);
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

function reject(product: LegacyProduct): string | null {
  if (!product.name) return "sin nombre";
  if (product.price <= 0) return "sin precio";
  return null;
}

async function upsertProduct(product: LegacyProduct) {
  const category = await db.category.upsert({
    where: { slug: product.categorySlug },
    create: { slug: product.categorySlug, name: titleCase(product.categoryName) },
    update: { name: titleCase(product.categoryName) },
  });

  // Lo que el sitio viejo guarda dentro del nombre y ML pide por separado.
  const name = cleanProductName(product.name);
  const brand = product.brand || resolveBrand(name);
  const fitments = detectFitments(name);

  const saved = await db.product.upsert({
    where: { sku: product.sku },
    create: {
      sku: product.sku,
      slug: await uniqueSlug(product.slug || slugify(name), product.sku),
      name,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      stock: product.stock,
      brand: brand || null,
      categoryId: category.id,
      legacyUrl: product.legacyUrl,
      importedAt: new Date(),
    },
    update: {
      name,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      stock: product.stock,
      brand: brand || null,
      categoryId: category.id,
      legacyUrl: product.legacyUrl,
      importedAt: new Date(),
    },
  });

  // Las fotos se reemplazan enteras: es una migración, no un merge.
  await db.productImage.deleteMany({ where: { productId: saved.id } });
  await db.productImage.createMany({
    data: product.images.map((url, position) => ({
      productId: saved.id,
      url,
      alt: name,
      position,
      // Heurística conservadora: las fotos con logo o marca de agua en el
      // nombre quedan marcadas para revisión, porque ML las rechaza.
      meliSafe: !/logo|watermark|marca-de-agua|placeholder/i.test(url),
    })),
  });

  await db.fitment.deleteMany({ where: { productId: saved.id } });
  if (fitments.length > 0) {
    await db.fitment.createMany({
      data: fitments.map((fitment) => ({ productId: saved.id, ...fitment })),
    });
  }
}

async function uniqueSlug(base: string, sku: string): Promise<string> {
  const existing = await db.product.findUnique({ where: { slug: base } });
  return existing ? `${base}-${slugify(sku)}` : base;
}

function titleCase(value: string): string {
  // Capitaliza solo la primera letra de cada palabra: \b\w rompe con "piñon".
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Lo que falta para poder publicar en ML. Es el trabajo real que viene después. */
function printGaps(products: LegacyProduct[]) {
  const sinMarca = products.filter(
    (product) => !(product.brand || resolveBrand(cleanProductName(product.name))),
  ).length;
  const sinCompatibilidad = products.filter(
    (product) => detectFitments(cleanProductName(product.name)).length === 0,
  ).length;
  const sinFotos = products.filter((product) => product.images.length === 0).length;
  const sinDescripcion = products.filter((product) => product.description.length < 30).length;

  console.log("\nPendientes para publicar en Mercado Libre:");
  console.log(`  sin marca:        ${sinMarca}/${products.length}`);
  console.log(`  sin fotos:        ${sinFotos}/${products.length}`);
  console.log(`  descripción corta:${sinDescripcion}/${products.length}`);
  console.log(`  sin compatibilidad:${sinCompatibilidad}/${products.length}`);

  const publicables = products.filter(
    (product) =>
      product.images.length > 0 &&
      product.price > 0 &&
      Boolean(product.brand || resolveBrand(cleanProductName(product.name))),
  ).length;
  console.log(`\nPublicables hoy en ML: ${publicables}/${products.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
