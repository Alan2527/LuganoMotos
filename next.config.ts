import type { NextConfig } from "next";

/**
 * El sitio corre en dos modos:
 *
 *  - completo (por defecto): servidor Next con base de datos, panel y la
 *    integración con Mercado Libre;
 *  - estático (`STATIC_EXPORT=1`): exporta solo la tienda a HTML para
 *    publicarla en GitHub Pages como demo. Sin servidor no hay panel ni
 *    publicación automática: el workflow saca esas rutas antes de exportar.
 *
 * `PAGES_BASE_PATH` es el subdirectorio donde queda servido el sitio
 * (`/LuganoMotos` en GitHub Pages de proyecto).
 */
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === "1" ? { output: "export" as const } : {}),
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
