'use client';

import type { AuditItem } from '@/lib/landing-types';
import { formatAuditDate } from '@/lib/landing-format';

type Props = {
  audit: AuditItem[];
  className?: string;
  max?: number;
};

export function AuditChips({ audit, className, max = 10 }: Props) {
  const show = audit.slice(0, max);
  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ''}`}>
      {show.map((a, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-xs text-slate-700"
        >
          {a.label}
          {a.version && <span className="font-medium text-slate-800">{a.version}</span>}
          <span className="text-muted"> — {formatAuditDate(a.date)}</span>
        </span>
      ))}
    </div>
  );
}
