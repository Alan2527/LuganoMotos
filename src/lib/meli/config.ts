/** Configuración de la integración con Mercado Libre. */
export const MELI = {
  apiBase: "https://api.mercadolibre.com",
  authBase: "https://auth.mercadolibre.com.ar",
  siteId: "MLA",
  currency: "ARS",
} as const;

export function meliEnv() {
  const clientId = process.env.MELI_CLIENT_ID;
  const clientSecret = process.env.MELI_CLIENT_SECRET;
  const redirectUri = process.env.MELI_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Faltan MELI_CLIENT_ID, MELI_CLIENT_SECRET o MELI_REDIRECT_URI. " +
        "Se crean en https://developers.mercadolibre.com.ar → Mis aplicaciones.",
    );
  }

  return { clientId, clientSecret, redirectUri };
}
