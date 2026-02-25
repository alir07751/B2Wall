'use client';

import { useState } from 'react';
import type { Opportunity, LandingMode, GrossNet } from '@/lib/landing-types';
import type { QuickViewTab } from './QuickViewDialog';
import { ShowcaseCard } from './ShowcaseCard';
import { SectionShell } from './SectionShell';
import { fa } from '@/strings/fa';

const INITIAL_CARD_COUNT = 3;

function getProgress(o: Opportunity) {
  return o.targetAmount > 0 ? Math.round((o.raisedAmount / o.targetAmount) * 100) : 0;
}

function filterInProgress(opps: Opportunity[]) {
  return opps.filter((o) => getProgress(o) < 100);
}

function filterCompleted(opps: Opportunity[]) {
  return opps.filter((o) => getProgress(o) >= 100);
}

type Props = {
  opportunities: Opportunity[];
  grossNet: GrossNet;
  mode: LandingMode;
  onQuickView?: (opp: Opportunity, tab?: QuickViewTab) => void;
  onCta?: (opp: Opportunity) => void;
};

export function OpportunitiesSection({
  opportunities,
  grossNet,
  mode,
  onQuickView,
  onCta,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const setShowCompletedAndReset = (value: boolean) => {
    setShowCompleted(value);
    setShowAll(false);
  };

  const inProgress = filterInProgress(opportunities);
  const completed = filterCompleted(opportunities);
  const activeList = showCompleted ? completed : inProgress;
  const displayList = showAll ? activeList : activeList.slice(0, INITIAL_CARD_COUNT);
  const hasMore = activeList.length > INITIAL_CARD_COUNT && !showAll;

  return (
    <SectionShell id="opportunities" ariaLabel="ویترین فرصت‌ها">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setShowCompletedAndReset(false)}
          className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
            !showCompleted ? 'bg-primary text-white' : 'border border-border bg-white text-slate-700 hover:bg-surface'
          }`}
        >
          {fa.showInProgress}
        </button>
        <button
          type="button"
          onClick={() => setShowCompletedAndReset(true)}
          className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
            showCompleted ? 'bg-primary text-white' : 'border border-border bg-white text-slate-700 hover:bg-surface'
          }`}
        >
          {fa.showCompleted}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {displayList.map((opp) => (
          <ShowcaseCard
            key={opp.id}
            opportunity={opp}
            grossNet={grossNet}
          />
        ))}
      </div>

      {activeList.length === 0 && (
        <p className="text-center text-muted py-8">
          {showCompleted ? 'فرصت تکمیل‌شده‌ای ثبت نشده است.' : 'فرصتی در حال جذب نیست.'}
        </p>
      )}

      <div className="text-center flex flex-wrap justify-center gap-2">
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex px-6 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors shadow-sm"
          >
            {fa.viewMore}
          </button>
        )}
        {showAll && activeList.length > INITIAL_CARD_COUNT && (
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="inline-flex px-6 py-3 rounded-2xl border border-border bg-white text-slate-700 font-semibold hover:bg-surface transition-colors shadow-sm"
          >
            {fa.viewLess}
          </button>
        )}
      </div>
    </SectionShell>
  );
}
