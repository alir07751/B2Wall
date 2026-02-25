'use client';

import type { OpportunityEvent } from '@/lib/landing-types';
import { formatFaDate } from '@/lib/landing-format';

type Props = {
  events: OpportunityEvent[];
  className?: string;
};

export function EventStrip({ events, className }: Props) {
  const list = events.filter((e) => e.date || e.label);
  const currentIndex = list.length > 0 ? list.length - 1 : -1;
  return (
    <div
      role="status"
      aria-label="زمان‌بندی رویدادها"
      className={`flex flex-wrap items-center gap-2 py-2 ${className ?? ''}`}
    >
      {list.map((e, i) => {
        const isCurrent = i === currentIndex;
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 text-xs ${isCurrent ? 'rounded-md bg-primary/10 px-2 py-1 font-medium text-primary' : e.date ? 'text-slate-600' : 'text-muted'}`}
          >
            <span className="font-medium">{e.label}</span>
            {e.date && (
              <span className={`rounded border px-1.5 py-0.5 ${isCurrent ? 'border-primary/30 text-primary' : 'border-border bg-surface text-muted'}`}>
                {formatFaDate(e.date)}
              </span>
            )}
            {i < list.length - 1 && (
              <span className="text-slate-300" aria-hidden>
                ←
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
