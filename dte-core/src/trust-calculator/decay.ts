export function linearDecay(
  signalTimestamp: number,
  referenceTime: number,
  halfLifeMs: number,
): number {
  if (halfLifeMs <= 0) return 1;
  const age = referenceTime - signalTimestamp;
  if (age <= 0) return 1;
  return Math.max(0, 1 - age / halfLifeMs);
}

export interface DecayFunction {
  (signalTimestamp: number, referenceTime: number, halfLifeMs: number): number;
}
