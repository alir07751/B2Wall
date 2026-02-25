'use client';

import { useState } from 'react';
import { SectionShell } from './SectionShell';
import { fa } from '@/strings/fa';

type Tab = 'invest' | 'borrow';

export function CalculatorTeaser() {
  const [tab, setTab] = useState<Tab>('invest');

  return (
    <SectionShell title="" ariaLabel="برآورد">
      <div className="rounded-2xl border border-border bg-white p-4 md:p-6 shadow-sm">
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 mb-4">
          <button
            type="button"
            onClick={() => setTab('invest')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'invest' ? 'bg-primary text-white' : 'text-muted hover:text-slate-700'
            }`}
          >
            {fa.calcTabInvest}
          </button>
          <button
            type="button"
            onClick={() => setTab('borrow')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'borrow' ? 'bg-primary text-white' : 'text-muted hover:text-slate-700'
            }`}
          >
            {fa.calcTabBorrow}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="text-xs text-muted">{fa.calcAmount}</span>
            <input
              type="text"
              placeholder="—"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              readOnly
              aria-readonly
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted">{fa.calcDuration}</span>
            <input
              type="text"
              placeholder="—"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              readOnly
              aria-readonly
            />
          </label>
        </div>

        <p className="text-sm text-muted mb-4">{fa.calcEstimate}: —</p>

        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          title="صفحه محاسبه به‌زودی"
        >
          {fa.calcCta}
        </button>
      </div>
    </SectionShell>
  );
}
