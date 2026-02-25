'use client';

import { useState } from 'react';
import { FileCheck, Shield, BarChart3, Calendar } from 'lucide-react';
import { fa } from '@/strings/fa';

const ITEMS = [
  { id: 'docs', label: fa.trustDocsReviewed, icon: FileCheck },
  { id: 'type', label: fa.trustGuaranteeType, icon: Shield },
  { id: 'index', label: fa.trustGuaranteeIndex, icon: BarChart3 },
  { id: 'schedule', label: fa.trustPaymentSchedule, icon: Calendar },
] as const;

export function TrustStripSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <section className="max-w-6xl mx-auto w-full px-4 py-4" aria-label="سازوکارهای اعتماد">
        <div className="flex flex-wrap justify-center gap-2">
          {ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setOpenId(openId === id ? null : id)}
              className="flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {openId && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/30"
          onClick={() => setOpenId(null)}
          aria-hidden
        >
          <div
            role="dialog"
            aria-label={ITEMS.find((i) => i.id === openId)?.label}
            className="rounded-2xl border border-border bg-white p-4 shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-medium text-slate-800">
              {ITEMS.find((i) => i.id === openId)?.label}
            </p>
            <p className="text-sm text-muted mt-1">{fa.trustPlaceholder}</p>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="mt-3 text-sm font-medium text-primary hover:underline"
            >
              {fa.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
