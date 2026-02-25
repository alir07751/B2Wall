'use client';

import type { CoverageState } from '@/lib/landing-types';
import { fa } from '@/strings/fa';
import { cn } from '@/lib/utils';

const STATE_LABELS: Record<CoverageState, string> = {
  Normal: fa.coverageNormal,
  Delayed: fa.coverageDelayed,
  ClaimInitiated: fa.coverageClaimInitiated,
  Covered: fa.coverageCoveredByB2Wall,
  Recovered: fa.coverageRecoveredFromGuarantee,
};

const STATE_STYLES: Record<CoverageState, string> = {
  Normal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Delayed: 'bg-amber-100 text-amber-800 border-amber-200',
  ClaimInitiated: 'bg-orange-100 text-orange-800 border-orange-200',
  Covered: 'bg-sky-100 text-sky-800 border-sky-200',
  Recovered: 'bg-slate-100 text-slate-700 border-slate-200',
};

type Props = {
  state: CoverageState;
  className?: string;
};

export function CoverageBadge({ state, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
        STATE_STYLES[state],
        className
      )}
    >
      {STATE_LABELS[state]}
    </span>
  );
}
