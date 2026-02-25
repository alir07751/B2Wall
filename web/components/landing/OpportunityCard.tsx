'use client';

import type { Opportunity, LandingMode, GrossNet } from '@/lib/landing-types';
import { formatFaToman, formatPct, REPAYMENT_LABELS, formatEstimatedMonthly, formatFaNum } from '@/lib/landing-format';
import { fa, CATEGORY_LABELS } from '@/strings/fa';
import { cn } from '@/lib/utils';
import { RiskCoverageChip } from './RiskCoverageChip';
import { Check } from 'lucide-react';

type Props = {
  opportunity: Opportunity;
  grossNet: GrossNet;
  mode: LandingMode;
  onQuickView?: (opp: Opportunity) => void;
  onCta?: (opp: Opportunity) => void;
};

const MAX_GUARANTEE_CHIPS = 2;

export function OpportunityCard({
  opportunity,
  grossNet,
  mode,
  onQuickView,
  onCta,
}: Props) {
  const {
    title,
    category,
    targetAmount,
    raisedAmount,
    durationMonths,
    repaymentPlan,
    grossAPR,
    netAPR,
    GI,
    guaranteePack,
    dossier,
  } = opportunity;

  const progress = targetAmount > 0 ? Math.round((raisedAmount / targetAmount) * 100) : 0;
  const outcomePct = grossNet === 'gross' ? grossAPR : netAPR;
  const guaranteeDisplay = guaranteePack.slice(0, MAX_GUARANTEE_CHIPS);
  const guaranteeOverflow = guaranteePack.length - MAX_GUARANTEE_CHIPS;
  const primaryOutcome =
    mode === 'investor'
      ? formatPct(outcomePct)
      : formatEstimatedMonthly(targetAmount, netAPR, durationMonths);
  const dossierComplete = dossier.length > 0 && dossier.every((d) => d.done);
  const isCompleted = progress >= 100;

  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  return (
    <article className="rounded-2xl border border-border bg-white p-4 flex flex-col gap-3 transition-shadow hover:shadow-sm overflow-hidden">
      <p className="text-xs text-muted tracking-wide">{categoryLabel}</p>
      <h3 className="font-semibold text-slate-800 truncate text-base" title={title}>
        {title}
      </h3>

      <div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded transition-all"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-xs font-tabular text-muted">
            {fa.raised}: {formatFaToman(raisedAmount)}  |  {fa.target}: {formatFaToman(targetAmount)}
          </p>
          {isCompleted ? (
            <span className="text-xs rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5">
              {fa.completedBadge}
            </span>
          ) : (
            <span className="text-xs font-tabular text-muted">{formatFaNum(progress)}{fa.percent}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-600">
          {fa.duration} {formatFaNum(durationMonths)} ماه
        </span>
        <span className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-slate-700">
          {REPAYMENT_LABELS[repaymentPlan]}
        </span>
        <RiskCoverageChip value={GI} />
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        {guaranteeDisplay.map((g, i) => (
          <span
            key={i}
            className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-slate-700"
          >
            {g.type}
          </span>
        ))}
        {guaranteeOverflow > 0 && (
          <span className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-muted">
            +{formatFaNum(guaranteeOverflow)}
          </span>
        )}
        {dossierComplete && (
          <span className="inline-flex items-center gap-0.5 text-xs text-emerald-700">
            <Check className="h-3 w-3" />
            {fa.verifiedChip}
          </span>
        )}
      </div>

      <div className="text-sm">
        <span className="text-muted">
          {mode === 'investor' ? fa.netYieldAnnual : fa.estimatedMonthlyInstallment}
        </span>
        <p className={cn('font-tabular font-bold', mode === 'investor' ? 'text-lg' : 'text-base')}>
          {primaryOutcome}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-border items-center">
        {onCta && (
          <button
            type="button"
            onClick={() => onCta(opportunity)}
            className="px-4 py-2 rounded-2xl text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
          >
            {mode === 'investor' ? fa.invest : fa.createSimilar}
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
    </article>
  );
}
