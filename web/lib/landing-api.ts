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

/** نرمال‌سازی یک آیتم خام API به Opportunity */
function mapItemToOpportunity(raw: Record<string, unknown>, index: number): Opportunity {
  const id = String(raw.id ?? raw.Id ?? raw.opportunityId ?? `opp-${index + 1}`);
  const title = String(raw.title ?? raw.Title ?? raw.name ?? 'فرصت تأمین مالی');
  const targetAmount = Number(raw.targetAmount ?? raw.target_amount ?? raw.target ?? 0) || 1;
  const raisedAmount = Number(raw.raisedAmount ?? raw.raised_amount ?? raw.raised ?? 0);
  const durationMonths = Number(raw.durationMonths ?? raw.duration_months ?? raw.duration ?? 12) || 12;
  const repaymentPlan = (raw.repaymentPlan ?? raw.repayment_plan ?? 'MONTHLY') as Opportunity['repaymentPlan'];
  const grossAPR = Number(raw.grossAPR ?? raw.gross_apr ?? raw.apr ?? 20) || 20;
  const netAPR = Number(raw.netAPR ?? raw.net_apr ?? grossAPR * 0.85) || 18;
  const GI = Number(raw.GI ?? raw.gi ?? raw.riskCoverage ?? 3) || 3;
  const category = String(raw.category ?? raw.Category ?? 'general');

  const guaranteePack = Array.isArray(raw.guaranteePack)
    ? (raw.guaranteePack as Array<{ type: string; verified?: boolean }>).map((g) => ({
        type: typeof g === 'object' && g && 'type' in g ? String(g.type) : String(g),
        verified: Boolean((g as { verified?: boolean }).verified),
      }))
    : [{ type: 'ضمانت', verified: true }];

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
