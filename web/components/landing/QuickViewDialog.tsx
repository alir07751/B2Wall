'use client';

import { useEffect, useState } from 'react';
import type { Opportunity, GrossNet, LandingMode } from '@/lib/landing-types';
import { formatFaToman, formatPct, REPAYMENT_LABELS, formatFaNum, formatFaDate } from '@/lib/landing-format';
import { EventStrip } from './EventStrip';
import { CoverageBadge } from './CoverageBadge';
import { ReportPreview } from './ReportPreview';
import { AuditChips } from './AuditChips';
import { CashflowPreview } from './CashflowPreview';
import { fa, CATEGORY_LABELS } from '@/strings/fa';
import { cn } from '@/lib/utils';
import { X, Lock, Check, Circle } from 'lucide-react';

export type QuickViewTab = 'overview' | 'proof' | 'timeline' | 'coverage' | 'reports' | 'audit' | 'cashflow';

const TABS: { id: QuickViewTab; label: string }[] = [
  { id: 'overview', label: fa.tabOverview },
  { id: 'proof', label: fa.tabProof },
  { id: 'timeline', label: fa.tabTimeline },
  { id: 'coverage', label: fa.tabCoverage },
  { id: 'reports', label: fa.tabReports },
  { id: 'audit', label: fa.tabAudit },
  { id: 'cashflow', label: fa.tabCashflow },
];

type Props = {
  opportunity: Opportunity | null;
  grossNet: GrossNet;
  mode: LandingMode;
  open: boolean;
  initialTab?: QuickViewTab;
  onClose: () => void;
  onRequestSensitive?: () => void;
  onAddToCompare?: (opp: Opportunity) => void;
  compareCount?: number;
  compareSelected?: boolean;
};

export function QuickViewDialog({
  opportunity,
  grossNet,
  mode,
  open,
  initialTab = 'overview',
  onClose,
  onRequestSensitive,
  onAddToCompare,
  compareCount = 0,
  compareSelected,
}: Props) {
  const [tab, setTab] = useState<QuickViewTab>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open, onClose]);

  if (!open || !opportunity) return null;

  const o = opportunity;
  const outcomePct = grossNet === 'gross' ? o.grossAPR : o.netAPR;
  const progress = o.targetAmount > 0 ? Math.round((o.raisedAmount / o.targetAmount) * 100) : 0;
  const canAddCompare = compareCount < 3 && !compareSelected;
  const outcomeLabel = grossNet === 'gross' ? fa.gross : fa.net;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-label="جزئیات فرصت"
        className="fixed inset-4 md:inset-8 z-50 overflow-hidden flex flex-col rounded-2xl border border-border bg-white shadow-2xl mx-auto max-w-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 truncate pl-2">{o.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary shrink-0"
            aria-label={fa.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-border overflow-x-auto shrink-0 flex-row-reverse">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-slate-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4 min-h-[240px]">
          {tab === 'overview' && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-muted">{CATEGORY_LABELS[o.category] ?? o.category}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted">{fa.target} / {fa.raised}</p>
                  <p className="font-tabular">{formatFaToman(o.targetAmount)} / {formatFaToman(o.raisedAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">{fa.outcome} ({outcomeLabel})</p>
                  <p className="font-bold font-tabular">{formatPct(outcomePct)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">{fa.duration} · بازپرداخت</p>
                  <p>{formatFaNum(o.durationMonths)} ماه · {REPAYMENT_LABELS[o.repaymentPlan]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">{fa.riskCoverageLabel}</p>
                  <p className="font-semibold font-tabular">{formatPct(o.GI)} <span className="text-xs font-normal text-muted">({fa.compareGI})</span></p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted mb-1">پیشرفت</p>
                <div className="h-2 bg-slate-200 rounded overflow-hidden">
                  <div className="h-full bg-primary rounded" style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted mb-1.5">{fa.compareGuarantees}</p>
                <div className="flex flex-wrap gap-1.5">
                  {o.guaranteePack.map((g, i) => (
                    <span key={i} className="rounded border border-border bg-surface px-2 py-0.5 text-xs">{g.type}</span>
                  ))}
                </div>
              </div>
              {onAddToCompare && canAddCompare && (
                <button
                  type="button"
                  onClick={() => onAddToCompare(o)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {fa.addToCompare}
                </button>
              )}
            </div>
          )}

          {tab === 'proof' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">{fa.dossierSection}</h3>
              {(() => {
                const latest = o.dossier.map((d) => d.updatedAt).filter(Boolean).sort().reverse()[0];
                return latest ? (
                  <p className="text-xs text-muted">
                    {fa.dossierLastUpdate}:{' '}
                    <span className="rounded border border-border bg-surface px-2 py-0.5 font-tabular">
                      {formatFaDate(latest)}
                    </span>
                  </p>
                ) : null;
              })()}
              <ul className="space-y-2">
                {o.dossier.map((item) => (
                  <li key={item.key} className="flex items-center gap-2 text-sm">
                    {item.done ? (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                    <span className={item.done ? 'text-slate-700' : 'text-muted'}>{item.label}</span>
                    {item.updatedAt && (
                      <span className="text-xs text-muted mr-auto">{formatFaDate(item.updatedAt)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">زمان‌بندی</h3>
              <EventStrip events={o.events} />
            </div>
          )}

          {tab === 'coverage' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">{fa.tabCoverage}</h3>
              <CoverageBadge state={o.coverageState} />
              <p className="text-xs text-muted">{fa.coverageFlowHint}</p>
            </div>
          )}

          {tab === 'reports' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">{fa.tabReports}</h3>
              <ReportPreview reports={o.reports} />
            </div>
          )}

          {tab === 'audit' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">{fa.tabAudit}</h3>
              <AuditChips audit={o.audit} max={6} />
            </div>
          )}

          {tab === 'cashflow' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">{fa.tabCashflow}</h3>
              <CashflowPreview items={o.cashflowPreview} />
            </div>
          )}
        </div>

        {onRequestSensitive && (
          <div className="border-t border-border p-4 shrink-0">
            <button
              type="button"
              onClick={onRequestSensitive}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Lock className="h-4 w-4" />
              {fa.requestSensitiveDetails}
            </button>
            <p className="text-xs text-muted mt-1">{fa.requestSensitiveHint}</p>
          </div>
        )}
      </div>
    </>
  );
}
