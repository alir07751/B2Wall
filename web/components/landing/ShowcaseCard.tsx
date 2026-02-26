'use client';

import type { Opportunity, GrossNet } from '@/lib/landing-types';
import { formatFaToman, formatPct, REPAYMENT_LABELS, formatFaNum } from '@/lib/landing-format';
import { fa } from '@/strings/fa';
import { LayoutGrid } from 'lucide-react';

type Props = {
  opportunity: Opportunity;
  grossNet: GrossNet;
  onQuickView?: (opp: Opportunity) => void;
  onCta?: (opp: Opportunity) => void;
};

export function ShowcaseCard({ opportunity, grossNet, onQuickView, onCta }: Props) {
  const {
    title,
    targetAmount,
    raisedAmount,
    durationMonths,
    repaymentPlan,
    netAPR,
    guaranteePack,
    imageUrl,
    ownerName,
  } = opportunity;

  const progress = targetAmount > 0 ? Math.round((raisedAmount / targetAmount) * 100) : 0;
  const planProfitPct = Math.round(netAPR);
  const guaranteeText = guaranteePack.map((g) => g.type).join('، ') || '—';
  const progressLabel = progress >= 100 ? fa.completedBadge : `${formatFaNum(progress)}٪`;

  return (
    <article className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col w-full max-w-full min-h-0">
      <div className="aspect-video bg-slate-200 flex items-center justify-center overflow-hidden relative">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <LayoutGrid className="h-12 w-12 text-slate-400" aria-hidden />
        )}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <h3 className="font-semibold text-slate-800 text-base leading-snug line-clamp-2" title={title}>
          {title}
        </h3>
        {ownerName && (
          <p className="text-xs text-muted -mt-1" title={ownerName}>{ownerName}</p>
        )}
        <div>
          <p className="text-xl font-bold text-primary font-tabular">{formatPct(planProfitPct)}</p>
          <p className="text-xs text-muted mt-0.5">{fa.planProfit}</p>
        </div>
        <div className="grid grid-cols-1 gap-1.5 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted">بازپرداخت:</span>
            <span className="text-slate-700">{REPAYMENT_LABELS[repaymentPlan]}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">{fa.duration}:</span>
            <span className="text-slate-700 font-tabular">{formatFaNum(durationMonths)} ماه</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">نوع ضمانت:</span>
            <span className="text-slate-700 text-xs truncate" title={guaranteeText}>{guaranteeText}</span>
          </div>
        </div>
        <div className="mt-auto pt-2">
          <div className="flex justify-between items-center text-xs text-muted mb-1.5">
            <span>{fa.progressLabel}</span>
            <span className="font-tabular">{progressLabel}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2 text-muted">
            <span className="text-slate-700">{fa.fundedLabel}: {formatFaToman(raisedAmount)}</span>
            <span>{fa.requiredLabel}: {formatFaToman(targetAmount)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {onCta && (
            <button
              type="button"
              onClick={() => onCta(opportunity)}
              className="px-4 py-2 rounded-2xl text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              {fa.invest}
            </button>
          )}
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(opportunity)}
              className="px-4 py-2 rounded-2xl border border-border bg-white text-slate-700 hover:bg-surface text-sm font-medium transition-colors"
            >
              {fa.quickView}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
