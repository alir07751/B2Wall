'use client';

import { useState } from 'react';
import { formatFaNum } from '@/lib/utils';
import { expectedPayout, expectedInterest } from '@/lib/returns';

export function ReturnCalculationPanel({
  expectedReturnAPR,
  durationDays,
  minAllocation,
}: {
  expectedReturnAPR: number;
  durationDays: number;
  minAllocation: number;
}) {
  const [open, setOpen] = useState(false);
  const exampleAmount = minAllocation;
  const payout = expectedPayout(exampleAmount, expectedReturnAPR, durationDays);
  const interest = expectedInterest(exampleAmount, expectedReturnAPR, durationDays);
  const years = (durationDays / 365).toFixed(2);

  return (
    <section className="rounded-lg border border-border bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between font-bold text-slate-800 text-right"
      >
        <span>نحوه محاسبه بازده</span>
        <span className="text-muted">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-3 text-sm text-slate-600 space-y-2">
          <p>فرمول (بازده ساده): مبلغ × (۱ + نرخ سالانه × مدت به سال)</p>
          <p className="font-tabular">
            مثال برای {formatFaNum(exampleAmount)} ریال — نرخ {expectedReturnAPR}٪ — مدت {durationDays} روز ({years} سال):
          </p>
          <p className="font-tabular">
            سود ≈ {formatFaNum(interest)} ریال — جمع اصل + سود ≈ {formatFaNum(payout)} ریال در پایان مدت
          </p>
        </div>
      )}
    </section>
  );
}
