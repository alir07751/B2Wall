/**
 * Return calculation: simple interest. Formula and example for transparency.
 */

export function expectedPayout(amount: number, aprPct: number, durationDays: number): number {
  const years = durationDays / 365;
  return Math.round(amount * (1 + (aprPct / 100) * years));
}

export function expectedInterest(amount: number, aprPct: number, durationDays: number): number {
  return expectedPayout(amount, aprPct, durationDays) - amount;
}
