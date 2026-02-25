'use client';

import { cn } from '@/lib/utils';

const STEPS = ['Funding Start', 'Payments', 'Settlement'];

type Props = {
  currentStep?: number; // 0, 1, 2
  className?: string;
};

export function MiniTimeline({ currentStep = 0, className }: Props) {
  return (
    <div className={cn('flex items-center gap-1', className)} aria-label="Project timeline">
      {STEPS.map((label, i) => (
        <span key={i} className="flex items-center gap-1">
          <span
            className={cn(
              'inline-flex h-2 w-2 rounded-full',
              i <= (currentStep ?? 0) ? 'bg-primary' : 'bg-slate-200'
            )}
            aria-hidden
          />
          <span className={cn('text-xs', i <= (currentStep ?? 0) ? 'text-slate-700' : 'text-muted')}>
            {label}
          </span>
          {i < STEPS.length - 1 && <span className="text-slate-300 text-xs">→</span>}
        </span>
      ))}
    </div>
  );
}
