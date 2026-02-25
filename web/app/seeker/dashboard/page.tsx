'use client';

import Link from 'next/link';
import { useDemoAuth } from '@/lib/demo-auth';
import { getProjectsForSeeker } from '@/lib/store';
import { formatFaNum, formatFaPct } from '@/lib/utils';
import { getFundingProbability } from '@/lib/funding-probability';
import { RoleGate } from '@/components/RoleGate';

const STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  pending: 'در انتظار بررسی',
  approved: 'تأیید شده',
  funding: 'در حال جذب',
  funded: 'تأمین شده',
  repaying: 'در حال بازپرداخت',
  completed: 'خاتمه یافته',
  defaulted: 'عدم بازپرداخت',
};

export default function SeekerDashboardPage() {
  const { user } = useDemoAuth();
  const projects = user ? getProjectsForSeeker(user.id) : [];
  const fundedCount = projects.filter((p) => ['funded', 'repaying', 'completed'].includes(p.status)).length;

  return (
    <RoleGate allowed={['seeker', 'admin']}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800">داشبورد سازنده</h1>
            <Link href="/seeker/new" className="text-sm text-primary hover:underline">ثبت پروژه جدید</Link>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          <section className="rounded-lg border border-border bg-white p-4">
            <h2 className="font-bold text-slate-800 mb-3">وضعیت تأمین</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted">تعداد پروژه‌های تأمین‌شده (سابقه)</p>
                <p className="font-bold font-tabular">{fundedCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted">کل پروژه‌ها</p>
                <p className="font-bold font-tabular">{projects.length}</p>
              </div>
            </div>
            <p className="text-xs text-muted mt-2">میانگین زمان تا تأمین و نرخ موفقیت در گزارشات بازار نمایش داده می‌شود.</p>
          </section>

          <section className="rounded-lg border border-border bg-white p-4">
            <h2 className="font-bold text-slate-800 mb-4">پروژه‌های شما</h2>
            {projects.length === 0 ? (
              <p className="text-sm text-muted">هنوز پروژه‌ای ثبت نکرده‌اید. با «ثبت پروژه جدید» شروع کنید.</p>
            ) : (
              <ul className="space-y-4">
                {projects.map((p) => {
                  const prob = getFundingProbability({
                    riskTier: p.riskTier,
                    expectedReturnAPR: p.expectedReturnAPR,
                    durationDays: p.durationDays,
                    guaranteeType: p.guaranteeType,
                    seekerHistory: fundedCount,
                  });
                  return (
                    <li key={p.id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Link href={`/projects/${p.id}`} className="font-medium text-slate-800 hover:underline">
                            {p.title}
                          </Link>
                          <p className="text-xs text-muted">{STATUS_LABELS[p.status] ?? p.status}</p>
                        </div>
                        {p.status === 'pending' && (
                          <Link href={`/admin/projects/${p.id}`} className="text-xs text-primary hover:underline">
                            (بررسی توسط مدیر)
                          </Link>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        <span className="font-tabular">{formatFaNum(p.fundedAmount)} / {formatFaNum(p.targetAmount)} ریال ({formatFaPct(p.progress)}٪)</span>
                        {p.fundingVelocity != null && p.fundingVelocity > 0 && (
                          <span className="text-muted">سرعت جذب: {formatFaNum(Math.round(p.fundingVelocity))} ریال/روز</span>
                        )}
                        <span className="text-muted">{prob.bandLabel}</span>
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
