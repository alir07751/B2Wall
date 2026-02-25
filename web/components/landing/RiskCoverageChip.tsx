'use client';

import { useState, useRef, useEffect } from 'react';
import { formatPct } from '@/lib/landing-format';
import { fa } from '@/strings/fa';
import { Info } from 'lucide-react';

type Props = {
  value: number | null | undefined;
  className?: string;
};

export function RiskCoverageChip({ value, className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [open]);

  const display = value != null && typeof value === 'number' ? formatPct(value) : fa.dash;

  return (
    <div ref={ref} className={`relative inline-flex items-center gap-1 ${className ?? ''}`}>
      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary">
        {fa.riskCoverageLabel}: {display}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="rounded p-0.5 text-muted hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label={fa.riskCoverageLabel}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={fa.riskCoverageLabel}
          className="absolute bottom-full right-0 mb-1 w-64 rounded-lg border border-border bg-white p-3 shadow-lg z-50 text-sm text-slate-700"
        >
          <p className="leading-relaxed">{fa.riskCoverageInfo1}</p>
          <p className="leading-relaxed mt-1">{fa.riskCoverageInfo2}</p>
          <p className="leading-relaxed mt-1">{fa.riskCoverageInfo3}</p>
        </div>
      )}
    </div>
  );
}
