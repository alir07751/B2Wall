/**
 * Map store project to detail view model. No DB; type-safe.
 */

import type { ProjectWithFunding } from '@/lib/store';

export type ProjectDetailVM = ProjectWithFunding & {
  seeker?: { id: string; name: string | null };
  repayments?: Array<{ id: string; amount: number; dueDate: string; status: string }>;
};

export function toProjectDetailVM(
  p: ProjectWithFunding,
  seeker?: { id: string; name: string | null },
  repayments?: Array<{ id: string; amount: number; dueDate: string; status: string }>
): ProjectDetailVM {
  return { ...p, seeker, repayments: repayments ?? [] };
}
