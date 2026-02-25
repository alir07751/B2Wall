'use client';

import { useEffect } from 'react';
import type { Opportunity, GrossNet } from '@/lib/landing-types';
import { formatAmount, formatPct } from '@/lib/landing-format';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type Props = {
  opportunity: Opportunity | null;
  grossNet: GrossNet;
  open: boolean;
  onClose: () => void;
};

export function CalculatorSheet({ opportunity, grossNet, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open, onClose]);

  if (!open || !opportunity) return null;

  const o = opportunity;
  const outcomePct = grossNet === 'gross' ? o.grossAPR : o.netAPR;
  const exampleAmount = 100_000_000;
  const exampleReturn = (exampleAmount * (outcomePct / 100) * o.durationMonths) / 12;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Scenario calculator"
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-auto rounded-t-2xl border-t border-border bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-white px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-800">Scenario / Calculate</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted truncate">{o.title}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted">Outcome ({grossNet})</p>
              <p className="font-bold font-tabular">{formatPct(outcomePct)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Duration</p>
              <p>{o.durationMonths} mo</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs text-muted mb-2">Example: {formatAmount(exampleAmount)} invested</p>
            <p className="text-lg font-bold font-tabular text-primary">
              Est. return: {formatAmount(exampleReturn)}
            </p>
            <p className="text-xs text-muted mt-1">Simplified; actual terms in contract.</p>
          </div>
        </div>
      </div>
    </>
  );
}
