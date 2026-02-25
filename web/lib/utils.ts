import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number with Persian digits for UI */
export function formatFaNum(n: number | null | undefined): string {
  if (n == null || typeof n !== 'number') return '—';
  return n.toLocaleString('fa-IR', { maximumFractionDigits: 0 });
}

/** Format percentage; input can be 0-1 or 0-100 */
export function formatFaPct(n: number | null | undefined): string {
  if (n == null || typeof n !== 'number') return '—';
  const pct = n <= 1 ? n * 100 : n;
  return pct.toLocaleString('fa-IR', { maximumFractionDigits: 1 }) + '٪';
}
