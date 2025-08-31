export function formatAnchorError(err: any) {
  const logs: string[] = err?.logs ?? err?.transactionLogs ?? [];
  const relevant = logs.find(
    (line) =>
      line.includes("already in use") ||
      line.includes("custom program error")
  );
  return relevant || err.message || "Unknown error";
}

/**
 * Convert a human-readable token amount to its on-chain representation
 * @param amount - Human readable amount (e.g. 10 tokens)
 * @param decimals - Number of decimals for the token (e.g. 6 for USDC-like tokens)
 * @returns bigint - On-chain amount (e.g. 10_000_000 for 10 tokens with 6 decimals)
 */
export function toDecimals(amount: number | string, decimals: number): bigint {
  const base = BigInt(10) ** BigInt(decimals);
  return BigInt(Math.floor(Number(amount) * Math.pow(10, decimals))) / (BigInt(10) ** (BigInt(decimals) - BigInt(decimals)));
}

/**
 * Convert back from on-chain representation to human-readable number
 * @param amount - On-chain amount (e.g. 10_000_000)
 * @param decimals - Number of decimals
 * @returns number - Human readable amount (e.g. 10)
 */
export function fromDecimals(amount: bigint, decimals: number): number {
  const base = 10 ** decimals;
  return Number(amount) / base;
}
