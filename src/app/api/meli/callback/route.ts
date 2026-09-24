import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForTokens } from "@/lib/meli/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  const jar = await cookies();
  const verifier = jar.get("meli_verifier")?.value;
  const expectedState = jar.get("meli_state")?.value;

  if (!code || !verifier) {
    return NextResponse.json({ error: "Falta el code o expiró la sesión de vinculación." }, { status: 400 });
  }
  if (!state || state !== expectedState) {
    return NextResponse.json({ error: "State inválido." }, { status: 400 });
  }

  try {
    const account = await exchangeCodeForTokens(code, verifier);
    jar.delete("meli_verifier");
    jar.delete("meli_state");

    return NextResponse.redirect(new URL(`/admin?vinculado=${account.userId}`, request.nextUrl.origin));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
