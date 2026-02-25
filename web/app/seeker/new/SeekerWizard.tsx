'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatFaNum, formatFaPct } from '@/lib/utils';
import { getFundingProbability } from '@/lib/funding-probability';
import { deriveRiskTier } from '@/lib/risk-tier';
import { createProject } from '@/lib/store';
import type { GuaranteeType } from '@/lib/types';

const GUARANTEE_OPTIONS: { value: GuaranteeType; label: string }[] = [
  { value: 'Collateral', label: 'وثیقه' },
  { value: 'Buyback', label: 'بازخرید' },
  { value: 'Insurance', label: 'بیمه' },
  { value: 'Personal', label: 'ضامن حقیقی' },
  { value: 'None', label: 'بدون ضمانت' },
];

const CATEGORIES = [
  { value: 'real_estate', label: 'املاک' },
  { value: 'manufacturing', label: 'تولید' },
  { value: 'trade', label: 'تجارت' },
  { value: 'services', label: 'خدمات' },
];

const ACCEPTANCE_CHECKLIST = [
  'عنوان و هدف پروژه واضح',
  'مبلغ هدف و حداقل مشارکت معقول',
  'نوع ضمانت و شرایط فعال‌سازی مشخص',
  'برنامه بازپرداخت تعریف شده',
  'بازده و مدت شفاف',
];

type FormState = {
  title: string;
  category: string;
  purpose: string;
  description: string;
  guaranteeType: GuaranteeType;
  guaranteeDetails: string;
  guaranteeTrigger: string;
  targetAmount: number;
  minAllocation: number;
  durationDays: number;
  expectedReturnAPR: number;
  repaymentTotal: number;
};

const defaultState: FormState = {
  title: '',
  category: 'real_estate',
  purpose: '',
  description: '',
  guaranteeType: 'Collateral',
  guaranteeDetails: '',
  guaranteeTrigger: '',
  targetAmount: 100_000_000,
  minAllocation: 10_000_000,
  durationDays: 365,
  expectedReturnAPR: 18,
  repaymentTotal: 0,
};

export function SeekerWizard({ seekerId, seekerHistory }: { seekerId: string; seekerHistory: number }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const riskTier = deriveRiskTier(form.guaranteeType, form.durationDays);
  const probability = getFundingProbability({
    riskTier,
    expectedReturnAPR: form.expectedReturnAPR,
    durationDays: form.durationDays,
    guaranteeType: form.guaranteeType,
    category: form.category,
    minAllocation: form.minAllocation,
    seekerHistory,
  });

  const totalSteps = 6;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function onSubmit() {
    if (!seekerId) return;
    setError('');
    setLoading(true);
    const result = createProject({
      title: form.title,
      category: form.category,
      purpose: form.purpose.slice(0, 90),
      description: form.description || undefined,
      guaranteeType: form.guaranteeType,
      guaranteeDetails: form.guaranteeDetails || undefined,
      guaranteeTrigger: form.guaranteeTrigger || undefined,
      targetAmount: form.targetAmount,
      minAllocation: form.minAllocation,
      durationDays: form.durationDays,
      expectedReturnAPR: form.expectedReturnAPR,
      riskTier,
      seekerId,
    });
    setLoading(false);
    if (result.ok) {
      router.push('/seeker/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 text-sm text-muted">
        {Array.from({ length: totalSteps }, (_, i) => (
          <span key={i} className={i + 1 <= step ? 'text-primary font-medium' : ''}>
            {i + 1}
          </span>
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 className="font-bold text-slate-800">۱. اطلاعات پایه</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-700 mb-1">عنوان پروژه</label>
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className="w-full rounded border border-border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">دسته</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="w-full rounded border border-border px-3 py-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">هدف پروژه (حداکثر ۹۰ کاراکتر)</label>
              <input
                value={form.purpose}
                onChange={(e) => update('purpose', e.target.value)}
                maxLength={90}
                className="w-full rounded border border-border px-3 py-2"
              />
              <p className="text-xs text-muted">{form.purpose.length}/90</p>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">مبلغ هدف (ریال)</label>
              <input
                type="number"
                value={form.targetAmount || ''}
                onChange={(e) => update('targetAmount', Number(e.target.value) || 0)}
                className="w-full rounded border border-border px-3 py-2 font-tabular"
              />
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="font-bold text-slate-800">۲. شرایط بازده و مدت</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-700 mb-1">بازده سالانه مورد انتظار (٪)</label>
              <input
                type="number"
                step={0.5}
                value={form.expectedReturnAPR}
                onChange={(e) => update('expectedReturnAPR', Number(e.target.value) || 0)}
                className="w-full rounded border border-border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">مدت (روز)</label>
              <input
                type="number"
                value={form.durationDays}
                onChange={(e) => update('durationDays', Number(e.target.value) || 0)}
                className="w-full rounded border border-border px-3 py-2"
              />
              <p className="text-xs text-muted">تقریباً {Math.round(form.durationDays / 30)} ماه</p>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">حداقل مشارکت (ریال)</label>
              <input
                type="number"
                value={form.minAllocation || ''}
                onChange={(e) => update('minAllocation', Number(e.target.value) || 0)}
                className="w-full rounded border border-border px-3 py-2 font-tabular"
              />
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="font-bold text-slate-800">۳. ضمانت</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-700 mb-1">نوع ضمانت</label>
              <select
                value={form.guaranteeType}
                onChange={(e) => update('guaranteeType', e.target.value as GuaranteeType)}
                className="w-full rounded border border-border px-3 py-2"
              >
                {GUARANTEE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">جزئیات ضمانت</label>
              <textarea
                value={form.guaranteeDetails}
                onChange={(e) => update('guaranteeDetails', e.target.value)}
                className="w-full rounded border border-border px-3 py-2"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">شرایط فعال‌سازی ضمانت</label>
              <input
                value={form.guaranteeTrigger}
                onChange={(e) => update('guaranteeTrigger', e.target.value)}
                className="w-full rounded border border-border px-3 py-2"
                placeholder="مثلاً: در صورت عدم بازپرداخت به موقع"
              />
            </div>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h2 className="font-bold text-slate-800">۴. برنامه بازپرداخت</h2>
          <p className="text-sm text-muted">در MVP یک قسط در پایان مدت در نظر گرفته می‌شود. جمع اصل + سود محاسبه می‌شود.</p>
          <div className="rounded border border-border bg-surface p-3 text-sm font-tabular">
            مبلغ بازپرداخت تقریبی: {formatFaNum(Math.round(form.targetAmount * (1 + (form.expectedReturnAPR / 100) * (form.durationDays / 365))))} ریال
          </div>
        </>
      )}

      {step === 5 && (
        <>
          <h2 className="font-bold text-slate-800">۵. اعتبار و مدارک</h2>
          <p className="text-sm text-muted">محل بارگذاری مدارک (placeholder). در MVP فقط ادامه دهید.</p>
        </>
      )}

      {step === 6 && (
        <>
          <h2 className="font-bold text-slate-800">۶. پیش‌نمایش و ارسال</h2>
          <div className="rounded-lg border border-border bg-white p-4 space-y-2">
            <p className="font-bold">{form.title}</p>
            <p className="text-sm text-slate-600">{form.purpose}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span>{formatFaPct(form.expectedReturnAPR)}</span>
              <span>{Math.round(form.durationDays / 30)} ماه</span>
              <span>ریسک {riskTier}</span>
              <span>حداقل {formatFaNum(form.minAllocation)} ریال</span>
            </div>
          </div>
          <div className="rounded border border-primary/20 bg-primary/5 p-3">
            <p className="font-medium text-slate-800">{probability.bandLabel}</p>
            <ul className="list-disc list-inside text-sm text-slate-600 mt-1">
              {probability.reasons.slice(0, 3).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            {probability.suggestions.length > 0 && (
              <p className="text-xs text-muted mt-2">پیشنهاد: {probability.suggestions[0]}</p>
            )}
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-700 mb-1">چک‌لیست پذیرش</p>
            <ul className="list-disc list-inside text-muted">
              {ACCEPTANCE_CHECKLIST.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </>
      )}

      <div className="flex gap-3 pt-4">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="py-2 px-4 rounded-lg border border-border text-sm">
            قبلی
          </button>
        ) : (
          <Link href="/seeker/dashboard" className="py-2 px-4 rounded-lg border border-border text-sm">انصراف</Link>
        )}
        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="py-2 px-4 rounded-lg bg-primary text-white text-sm"
          >
            بعدی
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !form.title.trim() || !form.purpose.trim()}
            className="py-2 px-4 rounded-lg bg-primary text-white text-sm disabled:opacity-50"
          >
            {loading ? 'در حال ارسال…' : 'ارسال برای بررسی'}
          </button>
        )}
      </div>
    </div>
  );
}
