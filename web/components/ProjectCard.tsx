'use client';

/**
 * Standardized project card — 8-second evaluation.
 * Guarantee dominant; risk tier; return; duration; progress; min allocation; purpose.
 * See docs/PROJECT-CARD-SCHEMA.md
 */

import Link from 'next/link';
import { formatFaNum, formatFaPct, cn } from '@/lib/utils';
import type { ProjectWithFunding } from '@/lib/store';

const GUARANTEE_LABELS: Record<string, string> = {
  Collateral: 'وثیقه',
  Buyback: 'بازخرید',
  Insurance: 'بیمه',
  Personal: 'ضامن حقیقی',
  None: 'بدون ضمانت',
};

type Props = {
  project: ProjectWithFunding;
  badge?: string;
  compact?: boolean;
};

export function ProjectCard({ project, badge, compact }: Props) {
  const {
    id,
    guaranteeType,
    riskTier,
    expectedReturnAPR,
    durationDays,
    targetAmount,
    minAllocation,
    purpose,
    progress,
    fundedAmount,
    fundingVelocity,
    fundingDeadline,
  } = project;

  const guaranteeLabel = GUARANTEE_LABELS[guaranteeType] ?? guaranteeType;
  const durationMonths = Math.round(durationDays / 30);
  const remainingDays = fundingDeadline
    ? Math.max(0, Math.ceil((new Date(fundingDeadline).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <article
      className={cn(
        'rounded-lg border border-border bg-white p-4 flex flex-col gap-3',
        compact && 'p-3 gap-2'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded border',
            guaranteeType === 'None'
              ? 'bg-amber-50 text-risk-C border-amber-200'
              : 'bg-slate-100 text-slate-700 border-border'
          )}
        >
          {guaranteeLabel}
        </span>
        {badge && (
          <span className="text-xs font-medium text-primary px-2 py-0.5 rounded border border-primary/30 bg-primary/5">
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-xs font-bold px-2 py-0.5 rounded border',
            riskTier === 'A' && 'bg-emerald-50 text-risk-A border-emerald-200',
            riskTier === 'B' && 'bg-slate-100 text-risk-B border-border',
            riskTier === 'C' && 'bg-amber-50 text-risk-C border-amber-200'
          )}
        >
          ریسک {riskTier}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>
          <p className="text-xs text-muted">بازده مورد انتظار</p>
          <p className="font-bold font-tabular text-base">{formatFaPct(expectedReturnAPR)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">مدت</p>
          <p className="font-bold font-tabular">{durationMonths} ماه</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted mb-1">پیشرفت جذب</p>
        <div className="h-2 bg-slate-200 rounded overflow-hidden">
          <div
            className={cn(
              'h-full rounded transition-all',
              progress >= 66 && 'bg-emerald-600',
              progress >= 33 && progress < 66 && 'bg-sky-500',
              progress < 33 && 'bg-slate-400'
            )}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <p className="text-xs font-tabular mt-0.5">
          {formatFaNum(fundedAmount)} / {formatFaNum(targetAmount)} ریال ({formatFaPct(progress)})
        </p>
        {fundingVelocity != null && fundingVelocity > 0 && (
          <p className="text-xs text-muted">سرعت جذب: ~{formatFaNum(Math.round(fundingVelocity / 1_000_000))} م.ریال/روز</p>
        )}
      </div>

      {remainingDays != null && remainingDays > 0 && (
        <p className="text-xs text-muted">{remainingDays} روز باقی‌مانده</p>
      )}

      <div>
        <p className="text-xs text-muted">حداقل مشارکت</p>
        <p className="font-semibold font-tabular">{formatFaNum(minAllocation)} ریال</p>
      </div>

      <p className="text-sm text-slate-700 line-clamp-2" title={purpose}>
        {purpose}
      </p>

      <Link
        href={`/projects/${id}`}
        className="mt-auto text-sm font-semibold text-primary hover:underline"
      >
        مشاهده جزئیات
      </Link>
    </article>
  );
}
