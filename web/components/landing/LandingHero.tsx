'use client';

import { fa } from '@/strings/fa';
import { cn } from '@/lib/utils';
import type { LandingMode } from '@/lib/landing-types';

const SEEKER_NEW_PATH = '/seeker/new';

type Props = {
  mode: LandingMode;
  onModeChange: (mode: LandingMode) => void;
};

export function LandingHero({ mode, onModeChange }: Props) {
  const hasSeekerRoute = true;

  return (
    <section className="max-w-6xl mx-auto w-full px-4 py-6" aria-label="شروع">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="#opportunities"
          className="inline-flex px-5 py-2.5 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors shadow-sm"
        >
          {fa.ctaSeeOpportunities}
        </a>
        {hasSeekerRoute ? (
          <a
            href={SEEKER_NEW_PATH}
            className={cn(
              'inline-flex px-5 py-2.5 rounded-2xl border font-semibold transition-colors',
              mode === 'seeker'
                ? 'bg-primary text-white border-primary hover:bg-primary-hover'
                : 'border-border bg-white text-slate-700 hover:bg-surface'
            )}
          >
            {fa.ctaSubmitOpportunity}
          </a>
        ) : (
          <span
            title="مسیر ثبت فرصت به‌زودی فعال می‌شود"
            className="inline-flex px-5 py-2.5 rounded-2xl border border-border bg-slate-100 text-muted font-medium cursor-not-allowed"
          >
            {fa.ctaSubmitOpportunity}
          </span>
        )}
      </div>
    </section>
  );
}
