/**
 * Shared domain types for frontend-only demo (no Prisma).
 */

export type DemoRole = 'investor' | 'seeker' | 'admin';

export type ProjectStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'funding'
  | 'funded'
  | 'repaying'
  | 'completed'
  | 'defaulted';

export type GuaranteeType = 'Collateral' | 'Buyback' | 'Insurance' | 'Personal' | 'None';

export type RepaymentStatus = 'scheduled' | 'paid' | 'late' | 'default';

export interface User {
  id: string;
  role: DemoRole;
  name: string | null;
  email: string;
  riskProfile?: string | null;
}

export interface Project {
  id: string;
  seekerId: string;
  title: string;
  category: string;
  purpose: string;
  description: string | null;
  guaranteeType: GuaranteeType;
  guaranteeDetails: string | null;
  guaranteeTrigger: string | null;
  riskTier: string;
  targetAmount: number;
  minAllocation: number;
  durationDays: number;
  expectedReturnAPR: number;
  status: ProjectStatus;
  fundingDeadline: string | null;
  approvedAt: string | null;
  fundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Funding {
  id: string;
  projectId: string;
  investorId: string;
  amount: number;
  createdAt: string;
}

export interface Repayment {
  id: string;
  projectId: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: RepaymentStatus;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string | null;
  status: string | null;
}

export interface MarketMetricDaily {
  id: string;
  date: string;
  totalFunded: number;
  totalRepaid: number;
  defaultCount: number;
  activeInvestors: number;
  newProjects: number;
  fundingVelocityAvg: number | null;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadataJson: string | null;
  createdAt: string;
}
