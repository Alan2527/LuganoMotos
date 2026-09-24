import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { MELI, meliEnv } from "./config";

/**
 * OAuth 2.0 con PKCE contra Mercado Libre.
 *
 * Dos detalles que rompen la mayoría de las integraciones:
 *  - el access_token dura 6 horas;
 *  - el refresh_token es de un solo uso: cada refresh devuelve uno nuevo y
 *    hay que persistirlo, o la integración se cae sola al día siguiente.
 */

export type PkcePair = { verifier: string; challenge: string };

export function createPkcePair(): PkcePair {
  const verifier = randomBytes(64).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function buildAuthorizationUrl(challenge: string, state: string): string {
  const { clientId, redirectUri } = meliEnv();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });
  return `${MELI.authBase}/authorization?${params}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
};

async function requestToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${MELI.apiBase}/oauth/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: new URLSearchParams(body),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Mercado Libre rechazó el token: ${JSON.stringify(json)}`);
  }
  return json as TokenResponse;
}

/** Canjea el `code` del callback por el primer par de tokens y guarda la cuenta. */
export async function exchangeCodeForTokens(code: string, verifier: string) {
  const { clientId, clientSecret, redirectUri } = meliEnv();
  const token = await requestToken({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  return persistTokens(token);
}

async function persistTokens(token: TokenResponse) {
  const userId = String(token.user_id);
  const expiresAt = new Date(Date.now() + token.expires_in * 1000);

  return db.meliAccount.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
    },
    update: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
    },
  });
}

/**
 * Devuelve un access_token vigente, refrescándolo si le quedan menos de 10
 * minutos de vida. Es el único punto por donde debería pedirse el token.
 */
export async function getValidAccessToken(): Promise<string> {
  const account = await db.meliAccount.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!account) {
    throw new Error("No hay cuenta de Mercado Libre vinculada. Entrá a /api/meli/auth.");
  }

  const marginMs = 10 * 60 * 1000;
  if (account.expiresAt.getTime() - marginMs > Date.now()) {
    return account.accessToken;
  }

  const { clientId, clientSecret } = meliEnv();
  const token = await requestToken({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: account.refreshToken,
  });

  const updated = await persistTokens(token);
  return updated.accessToken;
}
