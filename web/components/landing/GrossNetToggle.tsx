'use client';

import { cn } from '@/lib/utils';
import type { GrossNet } from '@/lib/landing-types';
import { fa } from '@/strings/fa';

type Props = {
  value: GrossNet;
  onChange: (v: GrossNet) => void;
  className?: string;
};

export function GrossNetToggle({ value, onChange, className }: Props) {
  return (
    <div
      role="group"
      aria-label="ناخالص یا خالص"
      className={cn('inline-flex rounded-2xl border border-border bg-surface p-0.5', className)}
    >
      <button
        type="button"
        onClick={() => onChange('gross')}
        aria-pressed={value === 'gross'}
        className={cn(
          'rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'gross'
            ? 'bg-slate-700 text-white shadow-sm'
            : 'text-muted hover:text-slate-700 hover:bg-white'
        )}
      >
        {fa.gross}
      </button>
      <button
        type="button"
        onClick={() => onChange('net')}
        aria-pressed={value === 'net'}
        className={cn(
          'rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'net'
            ? 'bg-slate-700 text-white shadow-sm'
            : 'text-muted hover:text-slate-700 hover:bg-white'
        )}
      >
        {fa.net}
      </button>
    </div>
  );
}
