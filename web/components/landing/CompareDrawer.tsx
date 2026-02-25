'use client';

import { useEffect } from 'react';
import type { Opportunity, GrossNet } from '@/lib/landing-types';
import { formatFaToman, formatPct, formatFaNum } from '@/lib/landing-format';
import { fa } from '@/strings/fa';
import { X, Trash2 } from 'lucide-react';

type Props = {
  opportunities: Opportunity[];
  grossNet: GrossNet;
  open: boolean;
  onClose: () => void;
  onRemove?: (id: string) => void;
  onClear?: () => void;
};

export function CompareDrawer({
  opportunities,
  grossNet,
  open,
  onClose,
  onRemove,
  onClear,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open, onClose]);

  if (!open) return null;

  const getOutcome = (o: Opportunity) => (grossNet === 'gross' ? o.grossAPR : o.netAPR);
  const guaranteePackDisplay = (o: Opportunity) =>
    o.guaranteePack.slice(0, 2).map((g) => g.type).join('، ') +
    (o.guaranteePack.length > 2 ? ` +${formatFaNum(o.guaranteePack.length - 2)}` : '') || fa.dash;
  const outcomeLabel = grossNet === 'gross' ? fa.gross : fa.net;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="مقایسه فرصت‌ها"
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-auto rounded-t-2xl border-t border-border bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-white px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-800">{fa.compare}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={fa.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm text-right border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-right py-3 pl-4 font-semibold text-slate-600 w-36">{fa.compareProject}</th>
                {opportunities.map((o) => (
                  <th key={o.id} className="text-right py-3 px-3 font-medium text-slate-700 max-w-[200px] align-top">
                    <div className="flex flex-col items-end gap-1">
                      <span className="truncate block w-full" title={o.title}>{o.title}</span>
                      {onRemove && (
                        <button
                          type="button"
                          onClick={() => onRemove(o.id)}
                          className="inline-flex items-center gap-1 text-xs text-muted hover:text-red-600 focus:outline-none"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {fa.compareRemove}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2.5 pl-4 text-muted font-medium">{fa.compareAmount}</td>
                {opportunities.map((o) => (
                  <td key={o.id} className="py-2.5 px-3 font-tabular">{formatFaToman(o.targetAmount)}</td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 pl-4 text-muted font-medium">{fa.compareDuration}</td>
                {opportunities.map((o) => (
                  <td key={o.id} className="py-2.5 px-3 font-tabular">{formatFaNum(o.durationMonths)} ماه</td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 pl-4 text-muted font-medium">{fa.compareOutcome} ({outcomeLabel})</td>
                {opportunities.map((o) => (
                  <td key={o.id} className="py-2.5 px-3 font-tabular">{formatPct(getOutcome(o))}</td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 pl-4 text-muted font-medium">{fa.compareGuarantees}</td>
                {opportunities.map((o) => (
                  <td key={o.id} className="py-2.5 px-3 text-xs">{guaranteePackDisplay(o)}</td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 pl-4 text-muted font-medium">{fa.compareRiskCoverage}</td>
                {opportunities.map((o) => (
                  <td key={o.id} className="py-2.5 px-3 font-tabular">{formatPct(o.GI)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-white px-4 py-3">
          {onClear && opportunities.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-2 rounded-lg border border-border text-slate-700 hover:bg-surface text-sm font-medium"
            >
              {fa.compareClear}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover"
          >
            {fa.close}
          </button>
        </div>
      </div>
    </>
  );
}
