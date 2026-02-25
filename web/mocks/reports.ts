/**
 * Report data derived from store or fixed mock for demo.
 */

export interface MarketHealthRow {
  windowDays: 30 | 90;
  projectCount: number;
  fundedCount: number;
  successRatePct: number;
  totalRaised: number;
  context: string;
}

export interface RepaymentByTierRow {
  tier: 'A' | 'B' | 'C';
  total: number;
  paid: number;
  ratePct: number | null;
}

export interface ReportsData {
  health30: MarketHealthRow;
  health90: MarketHealthRow;
  repayment: { rows: RepaymentByTierRow[]; context: string };
  velocity: { windowDays: number; currentAvgVelocity: number | null; context: string };
}

export function computeReportsFromStore(
  projectCount: number,
  fundedCount: number,
  totalRaised: number,
  repaymentRows: RepaymentByTierRow[],
  repaymentTotal: number,
  avgVelocity: number | null
): ReportsData {
  const successRate = projectCount ? Math.round((fundedCount / projectCount) * 100) : 0;
  return {
    health30: {
      windowDays: 30,
      projectCount,
      fundedCount,
      successRatePct: successRate,
      totalRaised,
      context: `بر اساس ${projectCount} پروژه در ۳۰ روز گذشته`,
    },
    health90: {
      windowDays: 90,
      projectCount,
      fundedCount,
      successRatePct: successRate,
      totalRaised,
      context: `بر اساس ${projectCount} پروژه در ۹۰ روز گذشته`,
    },
    repayment: {
      rows: repaymentRows,
      context: `بر اساس ${repaymentTotal} قسط بازپرداخت (همه‌زمان)`,
    },
    velocity: {
      windowDays: 30,
      currentAvgVelocity: avgVelocity,
      context: avgVelocity != null
        ? `میانگین سرعت جذب فعلی: ${avgVelocity.toLocaleString('fa-IR')} ریال/روز`
        : 'داده روزانه برای این بازه موجود نیست',
    },
  };
}
