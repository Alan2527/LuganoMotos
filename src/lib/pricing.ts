/**
 * Cálculo del precio de publicación en Mercado Libre.
 *
 * Publicar el mismo precio que la web es perder plata: ML cobra una comisión
 * por venta (que varía por categoría y tipo de publicación), un costo fijo en
 * las ventas chicas, IVA sobre esos cargos, y obliga a envío gratis a partir
 * de cierto monto. Este módulo despeja el precio que hay que publicar para
 * que al vendedor le quede el mismo neto que vendiendo por la web.
 */

export type MeliPricingConfig = {
  /** Comisión por venta, como fracción (0.155 = 15,5%). */
  commissionRate: number;
  /** IVA que ML aplica sobre la comisión y el costo fijo. */
  taxOnFees: number;
  /** Monto a partir del cual el envío gratis es obligatorio. */
  freeShippingThreshold: number;
  /** Costo fijo por venta en publicaciones por debajo del umbral. */
  fixedFeeBelowThreshold: number;
  /** Costo de envío que absorbe el vendedor arriba del umbral. */
  assumedShippingCost: number;
  /** Margen extra opcional sobre el neto, como fracción. */
  extraMargin: number;
};

export const DEFAULT_PRICING: MeliPricingConfig = {
  commissionRate: 0.155,
  taxOnFees: 0.21,
  freeShippingThreshold: 33000,
  fixedFeeBelowThreshold: 1500,
  assumedShippingCost: 0,
  extraMargin: 0,
};

export type PriceBreakdown = {
  webPrice: number;
  meliPrice: number;
  commission: number;
  fixedFee: number;
  shipping: number;
  netForSeller: number;
};

/**
 * Despeja el precio de publicación resolviendo:
 *   neto = precio - precio * comision * (1 + iva) - costoFijo * (1 + iva) - envio
 * para que `neto` sea el precio web (más el margen extra deseado).
 *
 * El envío entra en la ecuación solo si el precio resultante supera el umbral,
 * y como el propio envío puede empujar el precio por encima del umbral se
 * calculan ambos escenarios y se toma el consistente.
 */
export function calculateMeliPrice(
  webPrice: number,
  config: MeliPricingConfig = DEFAULT_PRICING,
): PriceBreakdown {
  const target = webPrice * (1 + config.extraMargin);
  const effectiveCommission = config.commissionRate * (1 + config.taxOnFees);

  const solve = (fixedFee: number, shipping: number) =>
    (target + fixedFee * (1 + config.taxOnFees) + shipping) / (1 - effectiveCommission);

  // Escenario A: por debajo del umbral, hay costo fijo y no hay envío gratis.
  const below = solve(config.fixedFeeBelowThreshold, 0);
  if (below < config.freeShippingThreshold) {
    return breakdown(webPrice, below, config, config.fixedFeeBelowThreshold, 0);
  }

  // Escenario B: arriba del umbral, sin costo fijo pero con envío a cargo del vendedor.
  const above = solve(0, config.assumedShippingCost);
  return breakdown(webPrice, above, config, 0, config.assumedShippingCost);
}

function breakdown(
  webPrice: number,
  rawPrice: number,
  config: MeliPricingConfig,
  fixedFee: number,
  shipping: number,
): PriceBreakdown {
  const meliPrice = roundToNiceNumber(rawPrice);
  const commission = meliPrice * config.commissionRate * (1 + config.taxOnFees);
  const fixed = fixedFee * (1 + config.taxOnFees);
  return {
    webPrice,
    meliPrice,
    commission: Math.round(commission),
    fixedFee: Math.round(fixed),
    shipping,
    netForSeller: Math.round(meliPrice - commission - fixed - shipping),
  };
}

/** Redondea hacia arriba: a decenas en precios chicos, a centenas en los grandes. */
function roundToNiceNumber(value: number): number {
  const step = value < 10000 ? 10 : 100;
  return Math.ceil(value / step) * step;
}
