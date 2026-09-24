import { db } from "@/lib/db";
import { MeliApiError } from "./client";
import { publishProduct, syncListing } from "./publisher";

const MAX_ATTEMPTS = 5;

export async function enqueue(type: string, productId: string, payload: unknown = {}) {
  return db.syncJob.create({
    data: { type, productId, payload: JSON.stringify(payload) },
  });
}

/**
 * Procesa la cola de sincronización. Pensado para correr desde un cron
 * (`npm run meli:worker`) cada pocos minutos: ML limita la tasa de llamadas,
 * así que conviene un goteo constante antes que ráfagas.
 */
export async function processQueue(limit = 20) {
  const jobs = await db.syncJob.findMany({
    where: { status: "pending", runAfter: { lte: new Date() } },
    orderBy: { runAfter: "asc" },
    take: limit,
  });

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const job of jobs) {
    await db.syncJob.update({ where: { id: job.id }, data: { status: "running" } });

    try {
      if (!job.productId) throw new Error("El job no tiene productId");

      if (job.type === "publish") await publishProduct(job.productId);
      else if (job.type === "sync") await syncListing(job.productId);
      else throw new Error(`Tipo de job desconocido: ${job.type}`);

      await db.syncJob.update({
        where: { id: job.id },
        data: { status: "done", attempts: job.attempts + 1, lastError: null },
      });
      results.push({ id: job.id, status: "done" });
    } catch (error) {
      const attempts = job.attempts + 1;
      const retryable = !(error instanceof MeliApiError) || error.retryable;
      const giveUp = attempts >= MAX_ATTEMPTS || !retryable;

      await db.syncJob.update({
        where: { id: job.id },
        data: {
          status: giveUp ? "failed" : "pending",
          attempts,
          lastError: String(error).slice(0, 1000),
          // Backoff exponencial: 1, 2, 4, 8 minutos.
          runAfter: new Date(Date.now() + 2 ** attempts * 30_000),
        },
      });
      results.push({ id: job.id, status: giveUp ? "failed" : "retry", error: String(error) });
    }
  }

  return results;
}
