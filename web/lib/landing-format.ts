/**
 * Consistent formatting for landing: Persian (fa-IR) numbers and local currency.
 * Same rounding everywhere (Gross/Net, cards, compare).
 */

const faNum = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
const faNumInt = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });

/** Integer with Persian digits (e.g. for progress). */
export function formatFaNum(value: number | null | undefined): string {
  if (value == null || typeof value !== 'number') return '—';
  return faNumInt.format(value);
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || typeof value !== 'number') return '—';
  return `${faNum.format(value)}٪`;
}

export function formatFaPct(value: number | null | undefined): string {
  return formatPct(value);
}

export function formatAmount(value: number | null | undefined): string {
  if (value == null || typeof value !== 'number') return '—';
  if (value >= 1_000_000_000) return `${faNum.format(value / 1_000_000_000)} میلیارد`;
  if (value >= 1_000_000) return `${faNumInt.format(value / 1_000_000)} میلیون`;
  if (value >= 1_000) return `${faNum.format(value / 1_000)} هزار`;
  return faNumInt.format(value);
}

/** تومان with compact unit: e.g. "۲٫۳ میلیارد تومان", "۱۵۰ میلیون تومان" */
export function formatFaToman(value: number | null | undefined): string {
  if (value == null || typeof value !== 'number') return '—';
  if (value >= 1_000_000_000) return `${faNum.format(value / 1_000_000_000)} میلیارد تومان`;
  if (value >= 1_000_000) return `${faNumInt.format(value / 1_000_000)} میلیون تومان`;
  if (value >= 1_000) return `${faNumInt.format(value)} هزار تومان`;
  return `${faNumInt.format(value)} تومان`;
}

export function formatAmountFull(value: number | null | undefined): string {
  if (value == null || typeof value !== 'number') return '—';
  return faNumInt.format(value);
}

export function formatGI(gi: number | null | undefined): string {
  if (gi == null || typeof gi !== 'number') return '—';
  return `GI ${faNum.format(gi)}٪`;
}

export const REPAYMENT_LABELS: Record<string, string> = {
  MONTHLY: 'ماهانه',
  BALLOON: 'گلوله‌ای',
  MIXED: 'ترکیبی',
};

/** Rough estimated monthly repayment (تومان) for seeker. */
export function formatEstimatedMonthly(targetAmount: number, netAPR: number, durationMonths: number): string {
  if (durationMonths <= 0) return '—';
  const total = targetAmount * (1 + (netAPR / 100) * (durationMonths / 12));
  return formatFaToman(Math.round(total / durationMonths));
}

/** Format date for display (fa-IR). */
export function formatFaDate(isoDate: string): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return isoDate;
  }
}

/** Jalali-style label for audit (۱۴۰۴/۱۱/۱۰). Mock can pass preformatted string. */
export function formatAuditDate(isoDate: string): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return isoDate;
  }
}
