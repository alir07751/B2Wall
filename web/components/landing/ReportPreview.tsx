'use client';

import { FileText, Calendar } from 'lucide-react';
import type { ReportsInfo } from '@/lib/landing-types';
import { fa } from '@/strings/fa';
import { formatFaNum } from '@/lib/landing-format';

type Props = {
  reports: ReportsInfo;
  className?: string;
};

export function ReportPreview({ reports, className }: Props) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <div className="flex items-center gap-2 text-sm text-muted">
        <FileText className="h-4 w-4" />
        <span>{fa.reportsCount}: {formatFaNum(reports.count)}</span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3" />
          {reports.cadence}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {reports.kpis.map((k) => (
          <span
            key={k.key}
            className="px-2 py-0.5 rounded bg-surface border border-border text-xs text-slate-600"
          >
            {k.label}: {k.value}
          </span>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-border bg-surface p-3">
        <p className="text-xs font-medium text-muted">{fa.reportSample}</p>
        <p className="text-sm mt-1">{reports.cadence} — {fa.reportsCount} {formatFaNum(reports.count)}</p>
      </div>
    </div>
  );
}
