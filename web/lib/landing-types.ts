/**
 * Typed Opportunity model for landing page (mock data, no backend).
 * Semantic consistency: GI, Net/Gross, Guarantee Pack, Repayment Plan.
 */

export type RepaymentPlanType = 'MONTHLY' | 'BALLOON' | 'MIXED';

export type CoverageState = 'Normal' | 'Delayed' | 'ClaimInitiated' | 'Covered' | 'Recovered';

export type GuaranteePackItem = {
  type: string;
  verified: boolean;
  valuationDate?: string;
  coverageLevel?: number;
};

export type DossierItem = {
  key: string;
  label: string;
  done: boolean;
  updatedAt: string;
};

export type OpportunityEvent = {
  label: string;
  date: string;
};

export type CashflowItem = {
  label: string;
  amount: number;
  date: string;
};

export type ReportKpi = {
  key: string;
  label: string;
  value: string;
};

export type ReportsInfo = {
  cadence: string;
  count: number;
  kpis: ReportKpi[];
};

export type AuditItem = {
  label: string;
  version: string;
  date: string;
};

export interface Opportunity {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  raisedAmount: number;
  durationMonths: number;
  repaymentPlan: RepaymentPlanType;
  grossAPR: number;
  netAPR: number;
  GI: number;
  guaranteePack: GuaranteePackItem[];
  dossier: DossierItem[];
  events: OpportunityEvent[];
  cashflowPreview: CashflowItem[];
  reports: ReportsInfo;
  audit: AuditItem[];
  coverageState: CoverageState;
  /** از API n8n (webhook/allopportunities) */
  imageUrl?: string;
  ownerName?: string;
}

export type LandingMode = 'investor' | 'seeker';

export type GrossNet = 'gross' | 'net';
