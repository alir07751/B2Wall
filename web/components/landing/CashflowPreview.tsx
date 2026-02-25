'use client';

import { useState } from 'react';
import type { CashflowItem } from '@/lib/landing-types';
import { formatFaToman, formatFaDate } from '@/lib/landing-format';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { fa } from '@/strings/fa';

type Props = {
  items: CashflowItem[];
  className?: string;
};

export function CashflowPreview({ items, className }: Props) {
  const [expanded, setExpanded] = useState(false);
  const display = expanded ? items : items.slice(0, 4);

  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      {items.length > 4 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-primary"
        >
          {fa.tabCashflow}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      )}
      <ul className="text-sm space-y-2">
        {display.map((item, i) => (
          <li key={i} className="flex justify-between gap-3 text-slate-700">
            <span>{item.label}</span>
            <span className="font-tabular text-left">
              {item.amount > 0 ? formatFaToman(item.amount) : fa.dash}
              {item.date ? ` — ${formatFaDate(item.date)}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
