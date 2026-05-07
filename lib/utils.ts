export function buildSolscanTxLink(signature: string | null | undefined): string | null {
  if (!signature) return null;
  if (signature.length < 80 || signature.length > 90) return null;
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(signature)) return null;
  return `https://solscan.io/tx/${signature}`;
}

