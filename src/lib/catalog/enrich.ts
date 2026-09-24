/**
 * Enriquecido automático del catálogo.
 *
 * El sitio viejo guarda todo en el nombre del producto ("Espejo Xr 250
 * Tornado", "Zapata Riffel Rouser 135/125"). Mercado Libre, en cambio, pide
 * marca y compatibilidades como atributos separados. Acá se intenta despejar
 * esos datos del propio nombre: lo que se detecta queda cargado, lo que no,
 * queda a la vista para completarlo a mano.
 */

/** Marcas de repuestos y accesorios que se venden en el local. */
const PART_BRANDS = [
  "Hawk", "NZI", "Riffel", "Ferodo", "Brembo", "NGK", "Motul", "Castrol", "Elf",
  "Shell", "Bosch", "DID", "Choho", "Sifam", "Michelin", "Pirelli", "Rinaldi",
  "Moura", "Yuasa", "Willard", "Bendix", "Trebol", "Metalpar", "Fram", "Mahle",
  "Ipone", "Wander", "Puig", "Givi", "Bieffe", "Punto Extremo", "Peels", "MT",
];

/** Marcas de moto, para compatibilidades. */
const MOTO_BRANDS = [
  "Honda", "Yamaha", "Suzuki", "Bajaj", "Motomel", "Zanella", "Gilera", "Corven",
  "Guerrero", "Keller", "Mondial", "Beta", "Kawasaki", "KTM", "Royal Enfield",
  "Benelli", "Jawa", "TVS", "Hero", "Brava", "Appia", "Sym", "Yumbo", "Okinoi",
];

/**
 * Modelos de moto y a qué marca pertenecen. La clave es el patrón que aparece
 * en los nombres de producto, normalizado sin acentos ni mayúsculas.
 */
const MODELS: Array<{ pattern: RegExp; brand: string; model: string }> = [
  { pattern: /\bxr\s?250\s?tornado\b|\btornado\b/, brand: "Honda", model: "XR 250 Tornado" },
  { pattern: /\bxr\s?150\s?l?\b/, brand: "Honda", model: "XR 150L" },
  { pattern: /\btitan\s?150\b|\bcg\s?150\b/, brand: "Honda", model: "CG 150 Titan" },
  { pattern: /\btwister\b|\bcb\s?250\b/, brand: "Honda", model: "CB 250 Twister" },
  { pattern: /\bfalcon\b|\bnx\s?400\b/, brand: "Honda", model: "NX 400 Falcon" },
  { pattern: /\bwave\b/, brand: "Honda", model: "Wave 110" },
  { pattern: /\bbiz\b/, brand: "Honda", model: "Biz 125" },
  { pattern: /\bgl\s?pro\b|\bcg\s?125\b/, brand: "Honda", model: "CG 125" },
  { pattern: /\bybr\s?125\b|\bybr\b/, brand: "Yamaha", model: "YBR 125" },
  { pattern: /\bfz\s?(s|16|25)?\b/, brand: "Yamaha", model: "FZ" },
  { pattern: /\bxtz\s?(125|250)\b/, brand: "Yamaha", model: "XTZ" },
  { pattern: /\bcrypton\b/, brand: "Yamaha", model: "Crypton" },
  { pattern: /\bax\s?100\b/, brand: "Suzuki", model: "AX 100" },
  { pattern: /\ben\s?125\b/, brand: "Suzuki", model: "EN 125" },
  { pattern: /\bgixxer\b/, brand: "Suzuki", model: "Gixxer" },
  { pattern: /\brouser\s?(ns)?\s?(125|135|150|160|180|200|220)\b|\brouser\b/, brand: "Bajaj", model: "Rouser" },
  { pattern: /\bdominar\s?(160|250|400)?\b/, brand: "Bajaj", model: "Dominar 400" },
  { pattern: /\bpulsar\b/, brand: "Bajaj", model: "Pulsar" },
  { pattern: /\bboxer\b/, brand: "Bajaj", model: "Boxer" },
  { pattern: /\bsmash\b/, brand: "Suzuki", model: "Smash 110" },
  { pattern: /\bskua\b/, brand: "Motomel", model: "Skua" },
  { pattern: /\bblitz\b/, brand: "Motomel", model: "Blitz 110" },
  { pattern: /\bs2\s?150\b|\bsirius\b/, brand: "Motomel", model: "Sirius" },
  { pattern: /\bzb\s?110\b/, brand: "Zanella", model: "ZB 110" },
  { pattern: /\brx\s?150\b/, brand: "Zanella", model: "RX 150" },
  { pattern: /\bstyler\b/, brand: "Zanella", model: "Styler" },
  { pattern: /\bsapucai\b/, brand: "Gilera", model: "Sapucai" },
  { pattern: /\bsmx\s?(200|400)?\b/, brand: "Gilera", model: "SMX" },
  { pattern: /\bvc\s?150\b/, brand: "Gilera", model: "VC 150" },
  { pattern: /\btriax\b/, brand: "Corven", model: "Triax" },
  { pattern: /\benergy\s?110\b/, brand: "Corven", model: "Energy 110" },
  { pattern: /\bhunter\b/, brand: "Corven", model: "Hunter" },
  { pattern: /\bnew\s?wave\b/, brand: "Honda", model: "New Wave" },
];

/** Texto promocional que ML no acepta en el título de la publicación. */
const PROMO_NOISE = [
  /\(\s*\d+\s*(y\s*\d+\s*)?cuotas?\s*\)/gi,
  /\b(oferta|promo|promoción|liquidación|sale|descuento)\b/gi,
  /\b\d+\s*%\s*(off|dto)\b/gi,
  /!+/g,
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Quita el ruido promocional y normaliza espacios. */
export function cleanProductName(name: string): string {
  let cleaned = name;
  for (const pattern of PROMO_NOISE) cleaned = cleaned.replace(pattern, " ");
  return cleaned.replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();
}

/**
 * Detecta la marca del repuesto (no la de la moto). Compara por palabra
 * completa: si no, "MT" matchea dentro de "Mt03 Wega" y se publica una marca
 * equivocada, que en ML es motivo de reclamo.
 */
export function detectPartBrand(name: string): string | undefined {
  const haystack = normalize(name);
  return PART_BRANDS.find((brand) =>
    new RegExp(`\\b${escapeRegExp(normalize(brand))}\\b`).test(haystack),
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type DetectedFitment = { brand: string; model: string };

/** Detecta para qué motos sirve el repuesto, a partir del nombre. */
export function detectFitments(name: string): DetectedFitment[] {
  const haystack = normalize(name);
  const found = new Map<string, DetectedFitment>();

  for (const entry of MODELS) {
    if (entry.pattern.test(haystack)) {
      found.set(`${entry.brand}|${entry.model}`, { brand: entry.brand, model: entry.model });
    }
  }

  // Si no se reconoció un modelo pero sí una marca de moto, igual sirve como
  // compatibilidad parcial.
  if (found.size === 0) {
    const brand = MOTO_BRANDS.find((candidate) =>
      new RegExp(`\\b${escapeRegExp(normalize(candidate))}\\b`).test(haystack),
    );
    if (brand) found.set(brand, { brand, model: "" });
  }

  return [...found.values()].filter((fitment) => fitment.model !== "");
}

/**
 * Marca a publicar en ML. Solo devuelve la marca del repuesto: poner la marca
 * de la moto ("Honda" en un repuesto alternativo para Honda) es declarar un
 * original que no lo es, y en ML eso termina en reclamo. Los repuestos sin
 * marca identificable se publican con MELI_DEFAULT_BRAND (típicamente
 * "Genérica"), que es una decisión comercial, no algo para adivinar.
 */
export function resolveBrand(name: string): string | undefined {
  return detectPartBrand(name) ?? process.env.MELI_DEFAULT_BRAND ?? undefined;
}
