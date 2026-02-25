'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Circle } from 'lucide-react';
import type { DossierItem } from '@/lib/landing-types';
import { cn } from '@/lib/utils';

type Props = {
  dossier: DossierItem[];
  trigger: React.ReactNode;
  className?: string;
};

export function DossierPopover({ dossier, trigger, className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [open]);

  const allDone = dossier.every((d) => d.done);
  const doneCount = dossier.filter((d) => d.done).length;

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
      >
        {trigger}
        <span className="text-xs">
          {doneCount}/{dossier.length}
        </span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Dossier status"
          className="absolute bottom-full end-0 mb-1 w-56 rounded-lg border border-border bg-white p-3 shadow-lg z-50"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Dossier
          </p>
          <ul className="space-y-2">
            {dossier.map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                )}
                <span className={item.done ? 'text-slate-700' : 'text-muted'}>
                  {item.label}
                </span>
                {item.updatedAt && (
                  <span className="text-xs text-muted ml-auto">{item.updatedAt.slice(0, 10)}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            {allDone ? 'Verified' : 'In progress'}
          </p>
        </div>
      )}
    </div>
  );
}
