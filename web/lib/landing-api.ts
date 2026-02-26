import type { Opportunity } from './landing-types';

const ALL_OPPORTUNITIES_URL = 'https://n8nb2wall.darkube.app/webhook/allopportunities';

const d = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);

function defaultDossier() {
  return [
    { key: 'identity', label: 'احراز هویت', done: true, updatedAt: d(30) },
    { key: 'collateral', label: 'ثبت ضمانت', done: false, updatedAt: '' },
    { key: 'valuation', label: 'ارزش‌گذاری', done: true, updatedAt: d(28) },
    { key: 'contract', label: 'قرارداد آماده', done: false, updatedAt: '' },
  ];
}

function defaultEvents() {
  return [
    { label: 'ثبت', date: d(45) },
    { label: 'تأیید', date: d(40) },
    { label: 'شروع تأمین', date: d(30) },
    { label: 'تسویه', date: '' },
  ];
}

/** نرمال‌سازی یک آیتم خام API (webhook/allopportunities) به Opportunity */
function mapItemToOpportunity(raw: Record<string, unknown>, index: number): Opportunity {
  const id = String(raw.id ?? raw.Id ?? raw.opportunityId ?? `opp-${index + 1}`);
  const title = String(raw.title ?? raw.Title ?? raw.name ?? 'فرصت تأمین مالی');
  // n8n: requiredAmountToman, fundedAmountToman
  const targetAmount = Number(raw.requiredAmountToman ?? raw.targetAmount ?? raw.target_amount ?? raw.target ?? 0) || 1;
  const fundedToman = Number(raw.fundedAmountToman ?? raw.raisedAmount ?? raw.raised_amount ?? raw.raised ?? 0);
  const progressPercent = Number(raw.progressPercent ?? raw.progress_percent ?? 0);
  const raisedAmount = progressPercent > 0 ? Math.round((progressPercent / 100) * targetAmount) : fundedToman;
  const durationMonths = Number(raw.durationMonths ?? raw.duration_months ?? raw.duration ?? 12) || 12;
  // n8n: profitPayoutIntervalDays 30 → MONTHLY, 90 → MIXED
  const payoutDays = Number(raw.profitPayoutIntervalDays ?? raw.principalPayoutIntervalDays ?? 30);
  const repaymentPlan = payoutDays <= 30 ? 'MONTHLY' : payoutDays <= 90 ? 'MIXED' : 'BALLOON';
  // n8n: monthlyProfitPercent (ماهانه)، planProfitPercent (کل دوره)
  const monthlyProfitPercent = Number(raw.monthlyProfitPercent ?? raw.monthly_profit_percent ?? 0);
  const planProfitPercent = Number(raw.planProfitPercent ?? raw.plan_profit_percent ?? 0);
  const grossAPR = monthlyProfitPercent > 0 ? monthlyProfitPercent * 12 : (planProfitPercent / durationMonths) * 12 || 20;
  const netAPR = planProfitPercent > 0 ? Math.round(planProfitPercent / durationMonths) : grossAPR * 0.85;
  const GI = Number(raw.GI ?? raw.gi ?? raw.riskCoverage ?? 3) || 3;
  const category = String(raw.category ?? raw.Category ?? raw.status ?? 'general');

  const guaranteeTypeStr = String(raw.guaranteeType ?? raw.guarantee_type ?? '');
  const guaranteePack = guaranteeTypeStr
    ? guaranteeTypeStr.split(/[،,]/).map((s) => ({ type: s.trim() || 'ضمانت', verified: true }))
    : Array.isArray(raw.guaranteePack)
      ? (raw.guaranteePack as Array<{ type: string; verified?: boolean }>).map((g) => ({
          type: typeof g === 'object' && g && 'type' in g ? String(g.type) : String(g),
          verified: Boolean((g as { verified?: boolean }).verified),
        }))
      : [{ type: 'ضمانت', verified: true }];

  const imageUrl = typeof raw.imageUrl === 'string' && raw.imageUrl ? raw.imageUrl : undefined;
  const ownerName = typeof raw.ownerName === 'string' && raw.ownerName ? raw.ownerName : undefined;

  return {
    id,
    title,
    category,
    targetAmount,
    raisedAmount,
    durationMonths,
    repaymentPlan: ['MONTHLY', 'BALLOON', 'MIXED'].includes(repaymentPlan) ? repaymentPlan : 'MONTHLY',
    grossAPR,
    netAPR,
    GI,
    guaranteePack,
    dossier: defaultDossier(),
    events: defaultEvents(),
    cashflowPreview: [],
    reports: { cadence: 'ماهانه', count: 0, kpis: [] },
    audit: [],
    coverageState: 'Normal',
    imageUrl,
    ownerName,
  };
}

export async function fetchAllOpportunities(): Promise<Opportunity[]> {
  try {
    const res = await fetch(ALL_OPPORTUNITIES_URL, {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : Array.isArray((data as { data?: unknown[] }).data) ? (data as { data: unknown[] }).data : [];
    return list.map((item: unknown, i: number) => mapItemToOpportunity((item as Record<string, unknown>) ?? {}, i));
  } catch {
    return [];
  }
}
