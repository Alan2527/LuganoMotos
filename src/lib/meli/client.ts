import { MELI } from "./config";
import { getValidAccessToken } from "./auth";

export class MeliApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "MeliApiError";
  }

  /** Los 429 y 5xx se reintentan; los 4xx de validación no tiene sentido reintentarlos. */
  get retryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Los endpoints públicos (categorías, predictor) no necesitan token. */
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
};

export async function meliFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, query } = options;

  const url = new URL(path.startsWith("http") ? path : `${MELI.apiBase}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (auth) headers.authorization = `Bearer ${await getValidAccessToken()}`;
  if (body !== undefined) headers["content-type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  const parsed = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new MeliApiError(
      res.status,
      parsed,
      `${method} ${url.pathname} → ${res.status}: ${describeError(parsed) ?? text.slice(0, 300)}`,
    );
  }

  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** ML devuelve los detalles útiles en `cause`, no en `message`. */
function describeError(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const asRecord = body as { message?: string; cause?: Array<{ message?: string }> };
  const causes = (asRecord.cause ?? []).map((c) => c.message).filter(Boolean);
  return [asRecord.message, ...causes].filter(Boolean).join(" | ") || null;
}
