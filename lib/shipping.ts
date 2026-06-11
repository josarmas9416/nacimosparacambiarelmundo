export const ORIENTE_PROVINCES = [
  'Napo',
  'Pastaza',
  'Morona Santiago',
  'Zamora Chinchipe',
  'Sucumbíos',
  'Orellana',
];

export interface ShippingResult {
  /** Shipping cost in centavos */
  cost: number;
  isInternational: boolean;
}

export function calculateShipping(
  pais: string,
  provincia: string,
  ciudad: string
): ShippingResult {
  if (pais.trim().toLowerCase() !== 'ecuador') {
    return { cost: 0, isInternational: true };
  }

  const prov = provincia.trim().toLowerCase();
  const city = ciudad.trim().toLowerCase();

  if (prov === 'pichincha') {
    return { cost: city === 'quito' ? 300 : 600, isInternational: false };
  }

  const isOriente = ORIENTE_PROVINCES.some((p) => p.toLowerCase() === prov);
  return { cost: isOriente ? 750 : 600, isInternational: false };
}

/** Server-side only — reads TSHIRT_PRICE env var */
export function getTshirtPrice(): number {
  return parseInt(process.env.TSHIRT_PRICE ?? '4999', 10);
}
