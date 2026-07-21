/**
 * Lightweight pub/sub for XP awards so the shell can play a fly-to-dashboard
 * burst without coupling progress storage to React.
 */
export type XpAwardPayload = {
  id: string;
  amount: number;
};

type Listener = (payload: XpAwardPayload) => void;

const listeners = new Set<Listener>();

export function subscribeXpAwards(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function publishXpAward(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) return;
  const payload: XpAwardPayload = {
    id: `xp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: Math.round(amount),
  };
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      /* ignore listener errors */
    }
  });
}
