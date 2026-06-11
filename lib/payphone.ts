const PAYPHONE_URL = 'https://pay.payphonetodoesposible.com/api/Links';

/**
 * Creates a one-time Payphone payment link.
 * @param amountCentavos  Total in centavos (e.g. 5499 = $54.99)
 * @param clientTransactionId  Max 15 chars, unique per transaction
 * @returns Plain string URL (not JSON)
 */
export async function createPayphoneLink(
  amountCentavos: number,
  clientTransactionId: string
): Promise<string> {
  const res = await fetch(PAYPHONE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYPHONE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountCentavos,
      amountWithoutTax: amountCentavos,
      currency: 'USD',
      clientTransactionId,
      storeId: process.env.PAYPHONE_STORE_ID,
      reference: 'Camiseta Ecuador 2026',
      oneTime: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Payphone ${res.status}: ${body}`);
  }

  return res.text();
}
