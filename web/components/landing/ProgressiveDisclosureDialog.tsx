'use client';

import { useEffect } from 'react';
import { Lock, CheckCircle } from 'lucide-react';
import { fa } from '@/strings/fa';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ProgressiveDisclosureDialog({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={fa.sensitiveDetailsTitle}
        className="fixed inset-4 md:max-w-md md:mx-auto md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 rounded-2xl border border-border bg-white shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{fa.sensitiveDetailsTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-slate-700"
            aria-label={fa.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 text-sm text-muted">
          <p>{fa.requestSensitiveHint}</p>
          <ul className="flex flex-col gap-2">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs">۱</span>
              {fa.sensitiveStep1}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs">۲</span>
              {fa.sensitiveStep2}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">
                <CheckCircle className="h-3 w-3" />
              </span>
              {fa.sensitiveStep3}
            </li>
          </ul>
        </div>
        <div className="mt-6 flex justify-start">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover"
          >
            {fa.gotIt}
          </button>
        </div>
      </div>
    </>
  );
}
