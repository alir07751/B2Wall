'use client';

import Link from 'next/link';
import { useDemoAuth } from '@/lib/demo-auth';
import { getFundingsForInvestor } from '@/lib/store';
import { formatFaNum, formatFaPct } from '@/lib/utils';
import { expectedPayout } from '@/lib/returns';
import { RoleGate } from '@/components/RoleGate';

const STATUS_LABELS: Record<string, string> = {
  funding: 'در حال جذب',
  funded: 'تأمین شده',
  repaying: 'تأمین شده',
  completed: 'خاتمه یافته',
};

export default function InvestorDashboardPage() {
  const { user } = useDemoAuth();
  const fundings = user ? getFundingsForInvestor(user.id) : [];

  let totalInvested = 0;
  let totalExpectedPayout = 0;
  const byRisk: Record<string, number> = { A: 0, B: 0, C: 0 };

  for (const f of fundings) {
    totalInvested += f.amount;
    const payout = expectedPayout(f.amount, f.project.expectedReturnAPR, f.project.durationDays);
    totalExpectedPayout += payout;
    byRisk[f.project.riskTier] = (byRisk[f.project.riskTier] ?? 0) + f.amount;
  }

  return (
    <RoleGate allowed={['investor', 'admin']}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800">داشبورد سرمایه‌گذار</h1>
            <div className="flex gap-3">
              <Link href="/investor/onboarding" className="text-sm text-muted hover:underline">تنظیمات</Link>
              <Link href="/projects" className="text-sm text-primary hover:underline">فرصت‌های سرمایه‌گذاری</Link>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          <section className="rounded-lg border border-border bg-white p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted">جمع سرمایه‌گذاری</p>
              <p className="font-bold font-tabular text-lg">{formatFaNum(totalInvested)} ریال</p>
            </div>
            <div>
              <p className="text-xs text-muted">بازده مورد انتظار (کل)</p>
              <p className="font-bold font-tabular">{formatFaNum(totalExpectedPayout)} ریال</p>
            </div>
            <div>
              <p className="text-xs text-muted">تعداد مشارکت</p>
              <p className="font-bold font-tabular">{fundings.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted">در معرض ریسک</p>
              <p className="text-sm font-tabular">A: {formatFaNum(byRisk.A)} | B: {formatFaNum(byRisk.B)} | C: {formatFaNum(byRisk.C)}</p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-4">
            <h2 className="font-bold text-slate-800 mb-4">مشارکت‌ها و بازده مورد انتظار</h2>
            {fundings.length === 0 ? (
              <p className="text-sm text-muted">هنوز مشارکتی ثبت نشده. از لیست پروژه‌ها یک فرصت انتخاب کنید.</p>
            ) : (
              <ul className="space-y-3">
                {fundings.map((f) => {
                  const payout = expectedPayout(f.amount, f.project.expectedReturnAPR, f.project.durationDays);
                  const statusLabel = STATUS_LABELS[f.project.status] ?? f.project.status;
                  return (
                    <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                      <div>
                        <Link href={`/projects/${f.project.id}`} className="font-medium text-slate-800 hover:underline">
                          {f.project.title}
                        </Link>
                        <p className="text-xs text-muted">
                          {formatFaNum(f.amount)} ریال — ریسک {f.project.riskTier} — {statusLabel}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-tabular">بازده مورد انتظار: {formatFaNum(payout)} ریال</p>
                        <p className="text-xs text-muted">{formatFaPct(f.project.expectedReturnAPR)} — {Math.round(f.project.durationDays / 30)} ماه</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </main>
      </div>
    </RoleGate>
  );
}
