'use client';

import { SectionShell } from './SectionShell';
import { fa } from '@/strings/fa';

const STEPS = [
  { title: fa.howStep1, desc: fa.howStep1Desc },
  { title: fa.howStep2, desc: fa.howStep2Desc },
  { title: fa.howStep3, desc: fa.howStep3Desc },
];

export function HowItWorks() {
  return (
    <SectionShell title={fa.howItWorksTitle} ariaLabel="مراحل کار">
      <ol className="flex flex-col md:flex-row gap-6 list-none p-0 m-0">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-4 flex-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold font-tabular">
              {i + 1}
            </span>
            <div>
              <h3 className="font-semibold text-slate-800">{step.title}</h3>
              <p className="text-sm text-muted mt-0.5">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
