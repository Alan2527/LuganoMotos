# Lugano Motos

Sitio nuevo de e-commerce de Lugano Motos (Av. Riestra 6251, CABA) con
publicación automática en Mercado Libre: todo producto que se carga en la web
se encola para publicarse en ML, y los cambios de precio y stock viajan solos
a la publicación.

## Stack

- **Next.js 15** (App Router, React 19, Tailwind 4) para la tienda y el panel.
- **Prisma + SQLite** en desarrollo; el mismo esquema corre en Postgres.
- **API de Mercado Libre** con OAuth 2.0 + PKCE, cola de sincronización y
  webhooks.

## Puesta en marcha

```bash
npm install
cp .env.example .env      # completar credenciales
npm run db:push           # crea la base
npm run import            # migra el catálogo del sitio viejo
npm run dev
```

## Migración del catálogo

`npm run import` trae el catálogo de https://luganomotos.com.ar respetando
fotos, descripciones y precios. Prueba tres estrategias en orden:

1. **Store API de WooCommerce** (`/wp-json/wc/store/v1/products`) — pública, sin
   credenciales. Es la que usa hoy el sitio.
2. **REST API de WooCommerce** — necesita `WC_CONSUMER_KEY` / `WC_CONSUMER_SECRET`;
   agrega SKU y stock reales.
3. **Scraping del HTML** guiado por el sitemap — último recurso.

Opciones: `--dry-run` (no escribe en la base, deja el dataset en
`data/legacy-catalog.json`), `--limit N`, `--base-url`.

Durante la importación se hace un enriquecido automático que el sitio viejo no
tiene y ML sí exige (`src/lib/catalog/enrich.ts`):

- limpia el título de texto promocional ("(3 y 6 cuotas)", "OFERTA"), que ML
  no acepta en las publicaciones;
- detecta la **marca del repuesto** por palabra completa (Hawk, NZI, Riffel, NGK…);
- deduce las **compatibilidades** de moto del nombre ("Zapata Riffel Rouser
  135/125" → Bajaj Rouser);
- descarta la imagen placeholder `producto-sin-foto`, que no es una foto del
  producto y haría rechazar la publicación.

### Estado del catálogo migrado

Sobre los 2.418 productos del sitio actual:

| | |
|---|---|
| Importados | 2.416 (2 sin precio) |
| Con foto real | 431 |
| Con marca detectada automáticamente | 222 |
| Con compatibilidad detectada | 1.238 |
| Publicables hoy en ML | 109 con marca real · 383 usando `MELI_DEFAULT_BRAND` |

El cuello de botella no es el software: **1.985 productos no tienen foto** y
Mercado Libre no publica sin foto. El panel muestra exactamente qué le falta a
cada producto.

## Demo en GitHub Pages

Cada push a la rama publica una demo estática en
https://alan2527.github.io/LuganoMotos/ (workflow `.github/workflows/pages.yml`).
El catálogo se vuelve a traer del sitio actual en cada deploy, así la demo
muestra siempre los productos y precios de hoy.

Es solo la tienda: **el panel y la publicación automática necesitan servidor**,
así que el workflow saca `src/app/api` y `src/app/admin` antes de exportar.
Para probar eso, hay que correr el sitio completo (`npm run dev`) o alojarlo en
Vercel, Railway o un VPS.

Para generarlo localmente:

```bash
PAGES_BASE_PATH=/LuganoMotos npm run build:pages   # deja el sitio en out/
```

El buscador funciona sin servidor: `npm run import` genera
`public/search-index.json` con los ~2.400 productos y el filtrado corre en el
cliente.

## Publicación en Mercado Libre

1. Crear la aplicación en developers.mercadolibre.com.ar y completar
   `MELI_CLIENT_ID`, `MELI_CLIENT_SECRET` y `MELI_REDIRECT_URI`.
2. Entrar a `/admin` y vincular la cuenta (OAuth con PKCE).
3. Cada producto nuevo se encola automáticamente
   (`MELI_AUTO_PUBLISH=true`); con `false`, todo pasa por aprobación manual
   desde el panel.
4. Correr el worker: `npm run meli:worker -- --loop`.

### Cómo funciona

- `src/lib/meli/auth.ts` — OAuth con PKCE. El `access_token` dura 6 h y el
  `refresh_token` es de un solo uso: se persiste el nuevo en cada refresh.
- `src/lib/meli/categories.ts` — predicción de categoría por título y consulta
  de atributos obligatorios.
- `src/lib/meli/mapper.ts` — arma el ítem: título con formato ML, atributos,
  garantía, fotos y envío.
- `src/lib/meli/publisher.ts` — valida antes de publicar. Nada sale sin foto,
  marca, precio, stock y descripción: publicar en masa con datos incompletos
  es la forma más rápida de que ML dé de baja las publicaciones.
- `src/lib/meli/queue.ts` — cola con reintentos y backoff exponencial. Los
  errores de validación (4xx) no se reintentan; los 429 y 5xx sí.
- `src/app/api/meli/notifications` — webhook de ML (`items`, `orders_v2`).
  Responde 200 siempre y encola: si tarda, ML reintenta y satura el endpoint.

### Precios

`src/lib/pricing.ts` no copia el precio de la web: lo despeja para que al
vendedor le quede el mismo neto después de la comisión de ML (11-17,5% según
categoría), el IVA sobre esa comisión, el costo fijo de las ventas chicas y el
envío gratis obligatorio a partir de $33.000. El panel muestra ambos precios
lado a lado.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Desarrollo |
| `npm run build` | Build de producción |
| `npm run import` | Migra el catálogo del sitio viejo |
| `npm run meli:worker` | Procesa la cola de sincronización (`-- --loop` para dejarlo corriendo) |
| `npm run db:push` | Aplica el esquema a la base |
| `npm run db:studio` | Explorador de datos de Prisma |

## Pendiente

- Carrito y checkout con Mercado Pago.
- Panel de carga y edición de productos (hoy el alta se hace por
  `createProduct()` en `src/lib/catalog/mutations.ts`).
- Fotos: es el bloqueo real para publicar el catálogo completo en ML.
- Publicación en catálogo (`catalog_listing`) y compatibilidades vía API para
  las categorías de motopartes que lo exigen.
