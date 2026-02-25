'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoAuth } from '@/lib/demo-auth';
import { updateRiskProfile } from '@/lib/store';

const RISK_OPTIONS = [
  { value: 'conservative', label: 'محافظه‌کار', desc: 'اولویت با حفظ اصل پول و ضمانت قوی' },
  { value: 'moderate', label: 'متوسط', desc: 'تعادل بین بازده و ریسک' },
  { value: 'aggressive', label: 'پذیرای ریسک', desc: 'بازده بالاتر با پذیرش ریسک بیشتر' },
] as const;

export function InvestorOnboardingForm({ initialRiskProfile }: { initialRiskProfile?: string | null }) {
  const router = useRouter();
  const { user } = useDemoAuth();
  const [profile, setProfile] = useState(initialRiskProfile ?? '');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !user?.id) return;
    updateRiskProfile(user.id, profile);
    router.push('/investor/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">ترجیح ریسک</p>
        <div className="space-y-2">
          {RISK_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                profile === opt.value ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <input
                type="radio"
                name="risk"
                value={opt.value}
                checked={profile === opt.value}
                onChange={() => setProfile(opt.value)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-slate-800">{opt.label}</p>
                <p className="text-xs text-muted">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted">در دمو این تنظیم در مرورگر ذخیره می‌شود.</p>
      <button
        type="submit"
        disabled={!profile}
        className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium disabled:opacity-50"
      >
        ذخیره و رفتن به داشبورد
      </button>
    </form>
  );
}
