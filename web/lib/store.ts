/**
 * In-memory store + localStorage persistence. Client-only for mutations.
 * Use getInitialState() for SSR or first paint; then hydrate from store on client.
 */

import type { Project, Funding, AuditLogEntry } from './types';
import { MOCK_PROJECTS_INITIAL } from '@/mocks/projects';
import { getInitialFundings } from '@/mocks/fundings';

const STORAGE_KEY = 'b2wall-store';

export type ProjectWithFunding = Project & {
  fundedAmount: number;
  progress: number;
  backersCount: number;
  fundingVelocity: number | null;
};

export type ProjectStatus = Project['status'];

function loadPersisted(): { projects: Project[]; fundings: Funding[]; riskProfiles: Record<string, string>; auditLog: AuditLogEntry[] } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePersisted(state: { projects: Project[]; fundings: Funding[]; riskProfiles: Record<string, string>; auditLog: AuditLogEntry[] }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

let state: {
  projects: Project[];
  fundings: Funding[];
  riskProfiles: Record<string, string>;
  auditLog: AuditLogEntry[];
} = {
  projects: [],
  fundings: [],
  riskProfiles: {},
  auditLog: [],
};

let hydrated = false;

function hydrate() {
  if (hydrated) return;
  const persisted = loadPersisted();
  if (persisted) {
    state = persisted;
  } else {
    state = {
      projects: JSON.parse(JSON.stringify(MOCK_PROJECTS_INITIAL)),
      fundings: getInitialFundings(),
      riskProfiles: { 'demo-investor': 'moderate' },
      auditLog: [],
    };
    savePersisted(state);
  }
  hydrated = true;
}

function ensureHydrated() {
  if (typeof window !== 'undefined') hydrate();
}

/** Call from client or server. Server returns initial mocks; client returns hydrated state. */
export function getState() {
  if (typeof window === 'undefined') return getInitialState();
  ensureHydrated();
  return state;
}

/** For SSR or initial paint: no localStorage, just mocks. */
export function getInitialState(): typeof state {
  return {
    projects: JSON.parse(JSON.stringify(MOCK_PROJECTS_INITIAL)),
    fundings: getInitialFundings(),
    riskProfiles: { 'demo-investor': 'moderate' },
    auditLog: [],
  };
}

function enrichProject(p: Project, fundings: Funding[]): ProjectWithFunding {
  const projectFundings = fundings.filter((f) => f.projectId === p.id);
  const fundedAmount = projectFundings.reduce((s, f) => s + f.amount, 0);
  const progress = p.targetAmount ? Math.min(100, (fundedAmount / p.targetAmount) * 100) : 0;
  const approvedAt = p.approvedAt ? new Date(p.approvedAt).getTime() : null;
  const daysSinceApproved = approvedAt ? Math.max(1, Math.floor((Date.now() - approvedAt) / 86400000)) : null;
  const fundingVelocity = daysSinceApproved && fundedAmount > 0 ? fundedAmount / daysSinceApproved : null;
  return {
    ...p,
    fundedAmount,
    progress: Math.round(progress),
    backersCount: projectFundings.length,
    fundingVelocity,
  };
}

const openStatuses: ProjectStatus[] = ['approved', 'funding', 'funded', 'repaying', 'completed'];

export function getProjects(filters?: { riskTier?: string; status?: ProjectStatus }): ProjectWithFunding[] {
  const s = getState();
  let list = s.projects.filter((p) => openStatuses.includes(p.status));
  if (filters?.riskTier) list = list.filter((p) => p.riskTier === filters.riskTier);
  if (filters?.status) list = list.filter((p) => p.status === filters.status);
  list = [...list].sort((a, b) => (b.approvedAt ?? '').localeCompare(a.approvedAt ?? ''));
  return list.map((p) => enrichProject(p, s.fundings));
}

export function getProject(id: string): (ProjectWithFunding & { seeker?: { id: string; name: string | null }; repayments?: Array<{ id: string; amount: number; dueDate: string; status: string }> }) | null {
  const s = getState();
  const p = s.projects.find((x) => x.id === id);
  if (!p) return null;
  const enriched = enrichProject(p, s.fundings);
  const seeker = { id: p.seekerId, name: 'سازنده نمونه' };
  return { ...enriched, seeker, repayments: [] };
}

export function createFunding(projectId: string, amount: number, investorId: string): { ok: true; fundingId: string } | { ok: false; error: string } {
  const s = getState();
  const project = s.projects.find((p) => p.id === projectId);
  if (!project) return { ok: false, error: 'پروژه یافت نشد.' };
  if (project.status !== 'funding') return { ok: false, error: 'این پروژه در مرحله جذب سرمایه نیست.' };
  if (amount < project.minAllocation) return { ok: false, error: `حداقل مشارکت ${project.minAllocation.toLocaleString('fa-IR')} ریال است.` };
  const fundedSoFar = s.fundings.filter((f) => f.projectId === projectId).reduce((sum, f) => sum + f.amount, 0);
  if (fundedSoFar + amount > project.targetAmount) return { ok: false, error: 'مبلغ از مبلغ باقی‌مانده بیشتر است.' };
  const id = 'fund-' + Date.now();
  state = getState();
  state.fundings.push({ id, projectId, investorId, amount, createdAt: new Date().toISOString() });
  state.auditLog.push({
    id: 'log-' + Date.now(),
    actorId: investorId,
    action: 'funding.create',
    entityType: 'Funding',
    entityId: id,
    metadataJson: JSON.stringify({ amount, projectId }),
    createdAt: new Date().toISOString(),
  });
  savePersisted(state);
  return { ok: true, fundingId: id };
}

export function createProject(payload: {
  title: string;
  category: string;
  purpose: string;
  description?: string;
  guaranteeType: Project['guaranteeType'];
  guaranteeDetails?: string;
  guaranteeTrigger?: string;
  targetAmount: number;
  minAllocation: number;
  durationDays: number;
  expectedReturnAPR: number;
  riskTier: string;
  seekerId: string;
}): { ok: true; projectId: string } {
  state = getState();
  const id = 'proj-' + Date.now();
  const now = new Date().toISOString();
  const project: Project = {
    id,
    seekerId: payload.seekerId,
    title: payload.title,
    category: payload.category,
    purpose: payload.purpose.slice(0, 200),
    description: payload.description ?? null,
    guaranteeType: payload.guaranteeType,
    guaranteeDetails: payload.guaranteeDetails ?? null,
    guaranteeTrigger: payload.guaranteeTrigger ?? null,
    riskTier: payload.riskTier,
    targetAmount: payload.targetAmount,
    minAllocation: payload.minAllocation,
    durationDays: payload.durationDays,
    expectedReturnAPR: payload.expectedReturnAPR,
    status: 'pending',
    fundingDeadline: null,
    approvedAt: null,
    fundedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  state.projects.push(project);
  state.auditLog.push({
    id: 'log-' + Date.now(),
    actorId: payload.seekerId,
    action: 'project.create',
    entityType: 'Project',
    entityId: id,
    metadataJson: null,
    createdAt: now,
  });
  savePersisted(state);
  return { ok: true, projectId: id };
}

export function updateProjectStatus(projectId: string, status: ProjectStatus): { ok: true } | { ok: false; error: string } {
  state = getState();
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) return { ok: false, error: 'پروژه یافت نشد.' };
  if (['funding', 'funded', 'repaying'].includes(project.status)) return { ok: false, error: 'پس از شروع جذب، وضعیت قابل تغییر نیست.' };
  project.status = status;
  project.updatedAt = new Date().toISOString();
  if (status === 'approved') project.approvedAt = new Date().toISOString();
  state.auditLog.push({
    id: 'log-' + Date.now(),
    actorId: null,
    action: 'project.status',
    entityType: 'Project',
    entityId: projectId,
    metadataJson: JSON.stringify({ status }),
    createdAt: new Date().toISOString(),
  });
  savePersisted(state);
  return { ok: true };
}

export function updateRiskProfile(userId: string, profile: string): void {
  state = getState();
  state.riskProfiles[userId] = profile;
  savePersisted(state);
}

export function getRiskProfile(userId: string): string | undefined {
  return getState().riskProfiles[userId];
}

/** Fundings for current investor (by userId). */
export function getFundingsForInvestor(investorId: string): Array<Funding & { project: Project }> {
  const s = getState();
  return s.fundings
    .filter((f) => f.investorId === investorId)
    .map((f) => {
      const project = s.projects.find((p) => p.id === f.projectId)!;
      return { ...f, project };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Projects for seeker. */
export function getProjectsForSeeker(seekerId: string): ProjectWithFunding[] {
  const s = getState();
  return s.projects
    .filter((p) => p.seekerId === seekerId)
    .map((p) => enrichProject(p, s.fundings))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getAuditLog(): AuditLogEntry[] {
  return [...getState().auditLog].reverse();
}

/** Repayment stats by risk tier (from store projects + any repayments). Demo: no repayments table, return zeros. */
export function getRepaymentByTier(): { tier: 'A' | 'B' | 'C'; total: number; paid: number; ratePct: number | null }[] {
  return [
    { tier: 'A', total: 0, paid: 0, ratePct: null },
    { tier: 'B', total: 0, paid: 0, ratePct: null },
    { tier: 'C', total: 0, paid: 0, ratePct: null },
  ];
}

/** Funding velocity trend: current avg from projects in funding. */
export function getFundingVelocityTrend(): { currentAvgVelocity: number | null; context: string } {
  const list = getProjects().filter((p) => p.status === 'funding' && p.fundingVelocity != null);
  const avg = list.length ? Math.round(list.reduce((s, p) => s + (p.fundingVelocity ?? 0), 0) / list.length) : null;
  return {
    currentAvgVelocity: avg,
    context: avg != null ? `میانگین سرعت جذب فعلی: ${avg.toLocaleString('fa-IR')} ریال/روز` : 'داده روزانه برای این بازه موجود نیست',
  };
}
