const SOLANA_ADDRESS_RE = /[1-9A-HJ-NP-Za-km-z]{32,44}/;

export function cleanSolanaAddress(input: string | null | undefined): string {
  const trimmed = (input ?? '').trim();
  const match = trimmed.match(SOLANA_ADDRESS_RE);
  return match ? match[0] : trimmed;
}
