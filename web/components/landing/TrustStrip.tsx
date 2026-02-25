'use client';

import { FileCheck, FileText, Shield, History } from 'lucide-react';
import type { QuickViewTab } from './QuickViewDialog';
import { fa } from '@/strings/fa';

type TrustItem = {
  id: QuickViewTab;
  label: string;
  icon: React.ReactNode;
};

const ITEMS: TrustItem[] = [
  { id: 'proof', label: fa.trustDossier, icon: <FileCheck className="h-5 w-5" /> },
  { id: 'reports', label: fa.trustReports, icon: <FileText className="h-5 w-5" /> },
  { id: 'coverage', label: fa.trustCoverage, icon: <Shield className="h-5 w-5" /> },
  { id: 'audit', label: fa.trustAudit, icon: <History className="h-5 w-5" /> },
];

type Props = {
  onOpenQuickViewTab: (tab: QuickViewTab) => void;
};

export function TrustStrip({ onOpenQuickViewTab }: Props) {
  return (
    <div role="group" aria-label="سازوکارهای اعتماد" className="flex flex-wrap items-center gap-2">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpenQuickViewTab(item.id)}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-slate-700 hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
