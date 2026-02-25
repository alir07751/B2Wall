'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatFaNum, formatFaPct } from '@/lib/utils';
import { expectedPayout, expectedInterest } from '@/lib/returns';
import { createFunding, getFundingsForInvestor } from '@/lib/store';
import { useDemoAuth } from '@/lib/demo-auth';

const GUARANTEE_LABELS: Record<string, string> = {
  Collateral: 'وثیقه',
  Buyback: 'بازخرید',
  Insurance: 'بیمه',
  Personal: 'ضامن حقیقی',
  None: 'بدون ضمانت',
};

type ProjectForInvest = {
  id: string;
  title: string;
  minAllocation: number;
  targetAmount: number;
  expectedReturnAPR: number;
  durationDays: number;
  guaranteeType: string;
  guaranteeTrigger: string | null;
  riskTier: string;
  fundedAmount: number;
};

export function InvestFlow({ project, isFirstTime: isFirstTimeProp }: { project: ProjectForInvest; isFirstTime?: boolean }) {
  const { user } = useDemoAuth();
  const isFirstTime = isFirstTimeProp ?? (user ? getFundingsForInvestor(user.id).length === 0 : true);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState(project.minAllocation);
  const [confirmRisk, setConfirmRisk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const remaining = project.targetAmount - project.fundedAmount;
  const maxAmount = Math.min(remaining, project.targetAmount);
  const payout = expectedPayout(amount, project.expectedReturnAPR, project.durationDays);
  const interest = expectedInterest(amount, project.expectedReturnAPR, project.durationDays);

  const canProceedStep2 = amount >= project.minAllocation && amount <= maxAmount;
  const canProceedStep3 = !isFirstTime || confirmRisk;

  async function onConfirm() {
    if (!user?.id) return;
    setError('');
    setLoading(true);
    const result = createFunding(project.id, amount, user.id);
    setLoading(false);
    if (result.ok) {
      setReceiptId(result.fundingId);
      setStep(3);
    } else {
      setError(result.error);
    }
  }

  if (step === 3 && receiptId) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 max-w-md mx-auto">
        <h2 className="text-lg font-bold text-slate-800 mb-4">سرمایه‌گذاری ثبت شد</h2>
        <p className="text-sm text-slate-700 mb-2">{project.title}</p>
        <p className="font-tabular font-bold text-primary">{formatFaNum(amount)} ریال</p>
        <p className="text-xs text-muted mt-2">
          بازده مورد انتظار (ساده): {formatFaNum(payout)} ریال در پایان مدت
        </p>
        <div className="mt-6 flex gap-3">
          <Link href={`/projects/${project.id}`} className="flex-1 text-center py-2 rounded-lg border border-border text-sm">
            بازگشت به پروژه
          </Link>
          <Link href="/investor/dashboard" className="flex-1 text-center py-2 rounded-lg bg-primary text-white text-sm">
            داشبورد سرمایه‌گذار
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-slate-800">سرمایه‌گذاری در پروژه</h1>
      <p className="text-sm text-slate-600">{project.title}</p>

      {step === 1 && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">مبلغ (ریال)</label>
            <input
              type="number"
              min={project.minAllocation}
              max={maxAmount}
              step={1000000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full rounded border border-border px-3 py-2 font-tabular"
            />
            <p className="text-xs text-muted mt-1">
              حداقل {formatFaNum(project.minAllocation)} — حداکثر {formatFaNum(maxAmount)} (باقی‌مانده)
            </p>
          </div>
          <div className="rounded border border-border bg-surface p-3 text-sm">
            <p className="text-muted mb-1">بازده مورد انتظار (ساده)</p>
            <p className="font-tabular font-bold">
              اصل + سود ≈ {formatFaNum(payout)} ریال (سود ≈ {formatFaNum(interest)} ریال) در {Math.round(project.durationDays / 30)} ماه
            </p>
            <p className="text-xs text-muted mt-1">
              فرمول: مبلغ × (۱ + نرخ سالانه × مدت به سال)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!canProceedStep2}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium disabled:opacity-50"
          >
            ادامه
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="rounded border border-border p-3 text-sm">
            <p className="font-tabular font-bold text-primary">{formatFaNum(amount)} ریال</p>
            <p className="text-muted">بازده مورد انتظار: {formatFaNum(payout)} ریال</p>
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-700 mb-1">خلاصه شرایط</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              <li>نوع ضمانت: {GUARANTEE_LABELS[project.guaranteeType] ?? project.guaranteeType}</li>
              <li>رتبه ریسک: {project.riskTier}</li>
              {project.guaranteeTrigger && <li>فعال‌سازی ضمانت: {project.guaranteeTrigger}</li>}
            </ul>
          </div>
          {isFirstTime && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmRisk} onChange={(e) => setConfirmRisk(e.target.checked)} className="mt-1" />
              <span className="text-sm">با توجه به رتبه ریسک و نوع ضمانت، با این سطح ریسک موافقم.</span>
            </label>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 py-2 rounded-lg border border-border text-sm">
              بازگشت
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canProceedStep3 || loading}
              className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium disabled:opacity-50"
            >
              {loading ? 'در حال ثبت…' : 'تأیید و ثبت'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
