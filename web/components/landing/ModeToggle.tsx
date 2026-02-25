'use client';

import { cn } from '@/lib/utils';
import type { LandingMode } from '@/lib/landing-types';
import { fa } from '@/strings/fa';

type Props = {
  value: LandingMode;
  onChange: (mode: LandingMode) => void;
  className?: string;
};

export function ModeToggle({ value, onChange, className }: Props) {
  return (
    <div
      role="group"
      aria-label="نوع کاربر"
      className={cn('inline-flex rounded-2xl border border-border bg-surface p-0.5', className)}
    >
      <button
        type="button"
        onClick={() => onChange('investor')}
        aria-pressed={value === 'investor'}
        className={cn(
          'rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'investor'
            ? 'bg-primary text-white shadow-sm'
            : 'text-muted hover:text-slate-700 hover:bg-white'
        )}
      >
        {fa.modeInvestor}
      </button>
      <button
        type="button"
        onClick={() => onChange('seeker')}
        aria-pressed={value === 'seeker'}
        className={cn(
          'rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'seeker'
            ? 'bg-primary text-white shadow-sm'
            : 'text-muted hover:text-slate-700 hover:bg-white'
        )}
      >
        {fa.modeSeeker}
      </button>
    </div>
  );
}
