/** Shared percent-change trend for Focus / analytics stat chips. */
export interface Trend {
  direction: "up" | "down";
  label: string;
}

/**
 * Compare current vs previous period.
 * Returns a chip only when the value actually changed — flat / 0% stays hidden.
 */
export function percentTrend(current: number, previous: number): Trend | undefined {
  if (previous <= 0) {
    return current > 0 ? { direction: "up", label: "New" } : undefined;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return undefined;
  return { direction: pct > 0 ? "up" : "down", label: `${Math.abs(pct)}%` };
}
