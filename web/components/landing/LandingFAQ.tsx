'use client';

import { useState } from 'react';
import { SectionShell } from './SectionShell';
import { fa } from '@/strings/fa';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS: { q: string; a: string }[] = [
  { q: fa.faqQ1, a: fa.faqA1 },
  { q: fa.faqQ2, a: fa.faqA2 },
  { q: fa.faqQ3, a: fa.faqA3 },
  { q: fa.faqQ4, a: fa.faqA4 },
  { q: fa.faqQ5, a: fa.faqA5 },
];

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <SectionShell id="faq" ariaLabel={fa.faqTitle}>
      <div className="rounded-3xl border border-border bg-white p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">{fa.faqTitle}</h2>
        <ul className="space-y-3 list-none p-0 m-0">
          {ITEMS.map((item, index) => (
            <li
              key={index}
              className={cn(
                'rounded-2xl border border-border bg-surface/50 overflow-hidden transition-colors',
                openIndex === index && 'ring-2 ring-primary/20 border-primary/30'
              )}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-3 text-right px-4 py-3 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-inset rounded-2xl"
                aria-expanded={openIndex === index}
              >
                <span className="font-medium text-slate-800">{item.q}</span>
                <ChevronDown
                  className={cn('h-5 w-5 shrink-0 text-muted transition-transform', openIndex === index && 'rotate-180')}
                  aria-hidden
                />
              </button>
              {openIndex === index && (
                <div className="border-t border-border px-4 pb-4 pt-1 bg-white/50">
                  <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
