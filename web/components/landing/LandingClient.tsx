'use client';

import { useState, useCallback } from 'react';
import type { Opportunity, LandingMode, GrossNet } from '@/lib/landing-types';
import type { QuickViewTab } from './QuickViewDialog';
import {
  HeaderNav,
  OpportunitiesSection,
  CompareDrawer,
  QuickViewDialog,
  ProgressiveDisclosureDialog,
  LandingFooter,
} from '@/components/landing';
import { fa } from '@/strings/fa';
import { formatFaNum } from '@/lib/landing-format';

type Props = {
  opportunities: Opportunity[];
};

export function LandingClient({ opportunities }: Props) {
  const [mode, setMode] = useState<LandingMode>('investor');
  const [grossNet, setGrossNet] = useState<GrossNet>('net');
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [quickViewOpp, setQuickViewOpp] = useState<Opportunity | null>(null);
  const [quickViewTab, setQuickViewTab] = useState<QuickViewTab>('overview');
  const [progressiveOpen, setProgressiveOpen] = useState(false);
  const [compareDrawerOpen, setCompareDrawerOpen] = useState(false);
  const [ctaDemoOpp, setCtaDemoOpp] = useState<Opportunity | null>(null);

  const openQuickView = useCallback((opp: Opportunity | null, tab?: QuickViewTab) => {
    setQuickViewOpp(opp);
    setQuickViewTab(tab ?? 'overview');
  }, []);

  const addToCompare = useCallback((opp: Opportunity) => {
    setCompareIds((prev) => {
      if (prev.size >= 3) return prev;
      const next = new Set(prev);
      next.add(opp.id);
      return next;
    });
  }, []);

  const compareList = opportunities.filter((o) => compareIds.has(o.id));

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="sticky top-0 z-30 border-b border-border bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <HeaderNav />
        </div>
      </header>

      <main className="flex-1">
        <OpportunitiesSection
          opportunities={opportunities}
          grossNet={grossNet}
          mode={mode}
          onQuickView={openQuickView}
          onCta={setCtaDemoOpp}
        />
      </main>

      {compareList.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
          <button
            type="button"
            onClick={() => setCompareDrawerOpen(true)}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold shadow-lg hover:bg-primary-hover"
          >
            {fa.compare} ({formatFaNum(compareList.length)})
          </button>
        </div>
      )}

      <CompareDrawer
        opportunities={compareList}
        grossNet={grossNet}
        open={compareDrawerOpen}
        onClose={() => setCompareDrawerOpen(false)}
        onRemove={(id) => setCompareIds((prev) => { const n = new Set(prev); n.delete(id); return n; })}
        onClear={() => setCompareIds(new Set())}
      />

      <QuickViewDialog
        opportunity={quickViewOpp}
        grossNet={grossNet}
        mode={mode}
        open={!!quickViewOpp}
        initialTab={quickViewTab}
        onClose={() => setQuickViewOpp(null)}
        onRequestSensitive={() => {
          setQuickViewOpp(null);
          setProgressiveOpen(true);
        }}
        onAddToCompare={addToCompare}
        compareCount={compareIds.size}
        compareSelected={quickViewOpp ? compareIds.has(quickViewOpp.id) : false}
      />

      <ProgressiveDisclosureDialog open={progressiveOpen} onClose={() => setProgressiveOpen(false)} />

      {ctaDemoOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" aria-hidden onClick={() => setCtaDemoOpp(null)} />
          <div role="dialog" aria-label={fa.demo} className="relative rounded-2xl border border-border bg-white p-6 shadow-xl max-w-sm w-full">
            <p className="font-semibold text-slate-800">
              {mode === 'investor' ? fa.invest : fa.createSimilar}
            </p>
            <p className="text-sm text-muted mt-1 truncate">{ctaDemoOpp.title}</p>
            <p className="text-xs text-muted mt-2">{fa.demo}</p>
            <button
              type="button"
              onClick={() => setCtaDemoOpp(null)}
              className="mt-4 w-full py-2 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover"
            >
              {fa.close}
            </button>
          </div>
        </div>
      )}

      <LandingFooter />
    </div>
  );
}
