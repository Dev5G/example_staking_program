export function formatAnchorError(err: any) {
  const logs: string[] = err?.logs ?? err?.transactionLogs ?? [];
  const relevant = logs.find(
    (line) =>
      line.includes("already in use") ||
      line.includes("custom program error")
  );
  return relevant || err.message || "Unknown error";
}