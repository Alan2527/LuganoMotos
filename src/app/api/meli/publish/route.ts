import { NextResponse, type NextRequest } from "next/server";
import { publishProduct } from "@/lib/meli/publisher";

export async function POST(request: NextRequest) {
  const { productId } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: "Falta productId" }, { status: 400 });
  }

  try {
    const result = await publishProduct(productId);
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
