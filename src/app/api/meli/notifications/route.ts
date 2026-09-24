import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { enqueue } from "@/lib/meli/queue";

/**
 * Webhook de Mercado Libre.
 *
 * ML reintenta si no recibe un 200 rápido, así que acá solo se encola: el
 * trabajo pesado lo hace el worker. Los topics que importan son `items`
 * (cambios en la publicación), `orders_v2` (ventas, para descontar stock) y
 * `questions`.
 */
export async function POST(request: NextRequest) {
  let payload: { topic?: string; resource?: string; user_id?: number };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const { topic, resource } = payload;

  if (topic === "orders_v2" && resource) {
    // El worker lee la orden y descuenta el stock local por SKU.
    await db.syncJob.create({
      data: { type: "order_received", payload: JSON.stringify(payload) },
    });
  }

  if (topic === "items" && resource) {
    const itemId = resource.split("/").pop();
    const listing = itemId
      ? await db.meliListing.findUnique({ where: { meliItemId: itemId } })
      : null;
    if (listing) await enqueue("sync", listing.productId, payload);
  }

  // Siempre 200: un error acá hace que ML reintente y sature el endpoint.
  return NextResponse.json({ ok: true });
}
