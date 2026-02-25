import type { Funding } from '@/lib/types';

/**
 * Initial fundings to pre-fill project progress (deterministic with mocks/projects).
 * proj-1: 45%, proj-2: 20%, proj-3: 75%, proj-4: 88%, proj-5: 30%, proj-6: 10%
 */
export function getInitialFundings(): Funding[] {
  const approved30Ago = new Date(Date.now() - 30 * 86400000).toISOString();
  return [
    { id: 'fund-1', projectId: 'proj-1', investorId: 'demo-investor', amount: 900_000_000, createdAt: approved30Ago },
    { id: 'fund-2', projectId: 'proj-2', investorId: 'demo-investor', amount: 300_000_000, createdAt: approved30Ago },
    { id: 'fund-3', projectId: 'proj-3', investorId: 'demo-investor', amount: 375_000_000, createdAt: approved30Ago },
    { id: 'fund-4', projectId: 'proj-4', investorId: 'demo-investor', amount: 704_000_000, createdAt: approved30Ago },
    { id: 'fund-5', projectId: 'proj-5', investorId: 'demo-investor', amount: 180_000_000, createdAt: approved30Ago },
    { id: 'fund-6', projectId: 'proj-6', investorId: 'demo-investor', amount: 40_000_000, createdAt: approved30Ago },
  ];
}
