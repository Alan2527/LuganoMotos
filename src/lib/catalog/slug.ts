export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Deriva un SKU legible cuando el sitio viejo no trae uno. */
export function fallbackSku(name: string, index: number): string {
  const base = slugify(name).replace(/-/g, "").slice(0, 12).toUpperCase();
  return `LM-${base || "ITEM"}-${String(index).padStart(4, "0")}`;
}
