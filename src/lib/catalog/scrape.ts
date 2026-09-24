import * as cheerio from "cheerio";
import { fallbackSku, slugify } from "./slug";
import type { LegacyProduct } from "./types";

/**
 * Extracción del catálogo del sitio actual (luganomotos.com.ar).
 *
 * Se intentan tres estrategias, de la más fiel a la más frágil:
 *  1. Store API de WooCommerce (`/wp-json/wc/store/v1/products`): pública,
 *     sin credenciales, devuelve todo estructurado.
 *  2. REST API de WooCommerce (`/wp-json/wc/v3/products`): necesita
 *     consumer key/secret, pero agrega stock y SKU internos.
 *  3. Scraping del HTML guiado por el sitemap: último recurso.
 */

export type ScrapeOptions = {
  baseUrl: string;
  consumerKey?: string;
  consumerSecret?: string;
  limit?: number;
};

export async function scrapeCatalog(
  options: ScrapeOptions,
): Promise<{ strategy: string; products: LegacyProduct[] }> {
  const strategies: Array<[string, () => Promise<LegacyProduct[]>]> = [
    ["woocommerce-store-api", () => fromStoreApi(options)],
    ["woocommerce-rest-api", () => fromRestApi(options)],
    ["html", () => fromHtml(options)],
  ];

  const failures: string[] = [];
  for (const [strategy, run] of strategies) {
    try {
      const products = await run();
      if (products.length > 0) return { strategy, products };
      failures.push(`${strategy}: 0 productos`);
    } catch (error) {
      failures.push(`${strategy}: ${String(error).slice(0, 140)}`);
    }
  }

  throw new Error(`No se pudo extraer el catálogo.\n${failures.join("\n")}`);
}

/** Reintenta los cortes de red: el sitio viejo no siempre responde a la primera. */
async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json", ...headers } });
      if (!res.ok) throw new Error(`${res.status} en ${url}`);
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }

  throw lastError;
}

type StoreApiProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  description: string;
  short_description: string;
  prices: { price: string; regular_price: string; currency_minor_unit: number };
  is_in_stock: boolean;
  images: Array<{ src: string; alt: string }>;
  categories: Array<{ name: string; slug: string }>;
};

async function fromStoreApi({ baseUrl, limit }: ScrapeOptions): Promise<LegacyProduct[]> {
  const products: LegacyProduct[] = [];

  for (let page = 1; page <= 50; page += 1) {
    const url = `${baseUrl}/wp-json/wc/store/v1/products?per_page=100&page=${page}`;
    const batch = await getJson<StoreApiProduct[]>(url);
    if (batch.length === 0) break;

    for (const item of batch) {
      const minorUnit = item.prices?.currency_minor_unit ?? 2;
      const toPesos = (value: string | undefined) =>
        value ? Math.round(Number(value) / 10 ** minorUnit) : 0;

      const category = item.categories?.[0];
      products.push({
        sku: item.sku || fallbackSku(item.name, item.id),
        name: cleanText(item.name),
        slug: item.slug || slugify(item.name),
        description: stripHtml(item.description),
        shortDescription: stripHtml(item.short_description),
        price: toPesos(item.prices?.price),
        compareAtPrice: toPesos(item.prices?.regular_price) || undefined,
        stock: item.is_in_stock ? 1 : 0,
        categoryName: category?.name ?? "Sin categoría",
        categorySlug: category?.slug ?? "sin-categoria",
        images: realImages((item.images ?? []).map((image) => image.src)),
        legacyUrl: item.permalink,
      });
    }

    if (limit && products.length >= limit) break;
  }

  return limit ? products.slice(0, limit) : products;
}

type RestApiProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  stock_quantity: number | null;
  stock_status: string;
  images: Array<{ src: string; alt: string }>;
  categories: Array<{ name: string; slug: string }>;
  attributes: Array<{ name: string; options: string[] }>;
};

async function fromRestApi({
  baseUrl,
  consumerKey,
  consumerSecret,
  limit,
}: ScrapeOptions): Promise<LegacyProduct[]> {
  if (!consumerKey || !consumerSecret) {
    throw new Error("sin credenciales de WooCommerce");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const products: LegacyProduct[] = [];

  for (let page = 1; page <= 50; page += 1) {
    const url = `${baseUrl}/wp-json/wc/v3/products?per_page=100&status=publish&page=${page}`;
    const batch = await getJson<RestApiProduct[]>(url, { authorization: `Basic ${auth}` });
    if (batch.length === 0) break;

    for (const item of batch) {
      const category = item.categories?.[0];
      const brandAttr = item.attributes?.find((attr) =>
        /marca|brand/i.test(attr.name),
      );

      products.push({
        sku: item.sku || fallbackSku(item.name, item.id),
        name: cleanText(item.name),
        slug: item.slug || slugify(item.name),
        description: stripHtml(item.description),
        shortDescription: stripHtml(item.short_description),
        price: Math.round(Number(item.price || 0)),
        compareAtPrice: Math.round(Number(item.regular_price || 0)) || undefined,
        stock: item.stock_quantity ?? (item.stock_status === "instock" ? 1 : 0),
        brand: brandAttr?.options?.[0],
        categoryName: category?.name ?? "Sin categoría",
        categorySlug: category?.slug ?? "sin-categoria",
        images: realImages((item.images ?? []).map((image) => image.src)),
        legacyUrl: item.permalink,
      });
    }

    if (limit && products.length >= limit) break;
  }

  return limit ? products.slice(0, limit) : products;
}

/**
 * Scraping del HTML. Se apoya en los datos estructurados de schema.org que
 * WooCommerce inyecta en cada ficha; si no están, cae a los selectores
 * clásicos del theme.
 */
async function fromHtml({ baseUrl, limit }: ScrapeOptions): Promise<LegacyProduct[]> {
  const urls = await collectProductUrls(baseUrl, limit);
  const products: LegacyProduct[] = [];

  for (const [index, url] of urls.entries()) {
    try {
      const html = await (await fetch(url)).text();
      const product = parseProductPage(html, url, index);
      if (product) products.push(product);
    } catch {
      // Una ficha rota no puede cortar la migración entera.
    }
  }

  return products;
}

async function collectProductUrls(baseUrl: string, limit?: number): Promise<string[]> {
  const candidates = [
    `${baseUrl}/wp-sitemap-posts-product-1.xml`,
    `${baseUrl}/product-sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap.xml`,
  ];

  const urls = new Set<string>();
  for (const candidate of candidates) {
    try {
      const xml = await (await fetch(candidate)).text();
      const $ = cheerio.load(xml, { xmlMode: true });

      $("loc").each((_, element) => {
        const loc = $(element).text().trim();
        if (/\/(producto|product)\//.test(loc)) urls.add(loc);
      });

      if (urls.size > 0) break;
    } catch {
      // Se prueba el siguiente sitemap.
    }
  }

  const list = [...urls];
  return limit ? list.slice(0, limit) : list;
}

function parseProductPage(html: string, url: string, index: number): LegacyProduct | null {
  const $ = cheerio.load(html);

  const jsonLd = $('script[type="application/ld+json"]')
    .map((_, element) => $(element).text())
    .get()
    .flatMap((raw) => {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [parsed, ...(parsed["@graph"] ?? [])];
      } catch {
        return [];
      }
    })
    .find((node) => node?.["@type"] === "Product");

  const name = cleanText(jsonLd?.name ?? $("h1.product_title, h1").first().text());
  if (!name) return null;

  const offers = Array.isArray(jsonLd?.offers) ? jsonLd.offers[0] : jsonLd?.offers;
  const priceText =
    offers?.price ?? $("p.price .woocommerce-Price-amount").first().text().replace(/[^\d]/g, "");

  const categorySlug = url.match(/\/categoria\/([^/]+)/)?.[1] ?? "sin-categoria";

  const images = new Set<string>();
  const ldImages = jsonLd?.image;
  if (typeof ldImages === "string") images.add(ldImages);
  if (Array.isArray(ldImages)) ldImages.forEach((image: string) => images.add(image));
  $(".woocommerce-product-gallery img").each((_, element) => {
    const src = $(element).attr("data-large_image") ?? $(element).attr("src");
    if (src) images.add(src);
  });

  return {
    sku: cleanText(jsonLd?.sku ?? $(".sku").first().text()) || fallbackSku(name, index),
    name,
    slug: slugify(name),
    description: stripHtml(
      jsonLd?.description ?? $("#tab-description, .woocommerce-Tabs-panel--description").html() ?? "",
    ),
    shortDescription: stripHtml($(".woocommerce-product-details__short-description").html() ?? ""),
    price: Math.round(Number(String(priceText).replace(/[^\d.]/g, "")) || 0),
    stock: /sin stock|agotado|out of stock/i.test($("p.stock").text()) ? 0 : 1,
    brand: cleanText(jsonLd?.brand?.name ?? ""),
    categoryName: categorySlug.replace(/-/g, " "),
    categorySlug,
    images: realImages([...images]),
    legacyUrl: url,
  };
}

/**
 * El sitio viejo muestra "producto-sin-foto" cuando la ficha no tiene imagen.
 * Esa no es una foto del producto: si se importa, ML rechaza la publicación.
 */
const PLACEHOLDER_IMAGE = /producto-sin-foto|placeholder|no-image|sin-imagen/i;

export function realImages(urls: string[]): string[] {
  return urls.filter((url) => !PLACEHOLDER_IMAGE.test(url));
}

function stripHtml(value: string): string {
  return cheerio.load(value ?? "").text().replace(/\s+/g, " ").trim();
}

function cleanText(value: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}
