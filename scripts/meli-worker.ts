/**
 * Worker de sincronización con Mercado Libre.
 *
 *   npm run meli:worker          # una pasada
 *   npm run meli:worker -- --loop  # queda corriendo cada 60 s
 */
import "./proxy-bootstrap";
import { db } from "../src/lib/db";
import { processQueue } from "../src/lib/meli/queue";

const loop = process.argv.includes("--loop");

async function tick() {
  const results = await processQueue();
  if (results.length > 0) console.log(new Date().toISOString(), results);
}

async function main() {
  if (!loop) {
    await tick();
    return;
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await tick();
    await new Promise((resolve) => setTimeout(resolve, 60_000));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    if (!loop) void db.$disconnect();
  });
