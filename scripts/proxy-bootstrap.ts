/**
 * Algunos entornos (contenedores de CI, sandboxes) salen a internet por un
 * proxy HTTP. `fetch` de Node no lee HTTPS_PROXY por su cuenta, así que los
 * scripts que hablan con el sitio viejo o con Mercado Libre importan esto
 * primero. Sin proxy configurado, no hace nada.
 */
import { ProxyAgent, setGlobalDispatcher } from "undici";

const proxyUrl = process.env.HTTPS_PROXY ?? process.env.https_proxy;

if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}
