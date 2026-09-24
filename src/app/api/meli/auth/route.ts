import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAuthorizationUrl, createPkcePair } from "@/lib/meli/auth";

/** Inicia la vinculación de la cuenta de Mercado Libre. */
export async function GET() {
  const { verifier, challenge } = createPkcePair();
  const state = randomBytes(16).toString("hex");

  const jar = await cookies();
  const options = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 600, path: "/" };
  jar.set("meli_verifier", verifier, options);
  jar.set("meli_state", state, options);

  return NextResponse.redirect(buildAuthorizationUrl(challenge, state));
}
