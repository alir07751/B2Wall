'use client';

import { fa } from '@/strings/fa';

export function FinalCTA() {
  return (
    <section className="max-w-6xl mx-auto w-full px-4 py-8" aria-label="پایان">
      <div className="rounded-2xl border border-border bg-white p-6 md:p-8 shadow-sm text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#opportunities"
            className="inline-flex px-5 py-2.5 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors shadow-sm"
          >
            {fa.finalCtaPrimary}
          </a>
          <a
            href={fa.seekerNewPath}
            className="inline-flex px-5 py-2.5 rounded-2xl border border-border bg-white text-slate-700 font-semibold hover:bg-surface transition-colors"
          >
            {fa.finalCtaSecondary}
          </a>
        </div>
      </div>
    </section>
  );
}
