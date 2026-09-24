import { MELI } from "./config";
import { meliFetch } from "./client";

export type PredictedCategory = {
  category_id: string;
  category_name: string;
  domain_id: string;
  domain_name: string;
};

export type CategoryAttribute = {
  id: string;
  name: string;
  value_type: "string" | "number" | "number_unit" | "boolean" | "list";
  tags?: Record<string, boolean>;
  values?: Array<{ id: string; name: string }>;
  allowed_units?: Array<{ id: string; name: string }>;
};

/**
 * Predice la categoría de ML a partir del título del producto.
 * Es la forma recomendada de mapear un catálogo entero sin elegir a mano
 * entre las miles de categorías del árbol.
 */
export async function predictCategory(title: string): Promise<PredictedCategory | null> {
  const results = await meliFetch<PredictedCategory[]>(
    `/sites/${MELI.siteId}/domain_discovery/search`,
    { auth: false, query: { limit: 1, q: title } },
  );
  return results[0] ?? null;
}

export async function getCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
  return meliFetch<CategoryAttribute[]>(`/categories/${categoryId}/attributes`, { auth: false });
}

/** Atributos que ML exige completar para poder publicar en esa categoría. */
export async function getRequiredAttributes(categoryId: string): Promise<CategoryAttribute[]> {
  const attributes = await getCategoryAttributes(categoryId);
  return attributes.filter((attr) => attr.tags?.required || attr.tags?.catalog_required);
}
