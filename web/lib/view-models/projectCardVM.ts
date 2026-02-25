/**
 * Map store/mock project to card view model. No DB; type-safe.
 */

import type { ProjectWithFunding } from '@/lib/store';

export type ProjectCardVM = ProjectWithFunding;

export function toProjectCardVM(p: ProjectWithFunding): ProjectCardVM {
  return p;
}
