import Link from 'next/link';
import { getState } from '@/lib/store';
import { formatFaNum } from '@/lib/utils';
import { RoleGate } from '@/components/RoleGate';

export const dynamic = 'force-dynamic';

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

export default function AdminProjectsPage() {
  const state = getState();
  const projects = state.projects
    .map((p) => {
      const funded = state.fundings.filter((f) => f.projectId === p.id).reduce((s, f) => s + f.amount, 0);
      const progress = p.targetAmount ? Math.round((funded / p.targetAmount) * 100) : 0;
      return { ...p, funded, progress };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const pending = projects.filter((p) => p.status === 'pending');

  return (
    <RoleGate allowed={['admin']}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800">مدیریت پروژه‌ها</h1>
            <Link href="/" className="text-sm text-primary hover:underline">صفحه اصلی</Link>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          {pending.length > 0 && (
            <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <h2 className="font-bold text-slate-800 mb-2">در انتظار بررسی ({pending.length})</h2>
              <ul className="space-y-2">
                {pending.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/projects/${p.id}`} className="text-primary hover:underline font-medium">
                      {p.title}
                    </Link>
                    <span className="text-sm text-muted mr-2">— سازنده نمونه</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="rounded-lg border border-border bg-white overflow-hidden">
            <h2 className="font-bold text-slate-800 p-4 border-b border-border">همه پروژه‌ها</h2>
            <ul className="divide-y divide-border">
              {projects.map((p) => (
                <li key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link href={`/admin/projects/${p.id}`} className="font-medium text-slate-800 hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted">{STATUS_LABELS[p.status] ?? p.status} — سازنده نمونه</p>
                  </div>
                  <div className="text-sm font-tabular">
                    {formatFaNum(p.funded)} / {formatFaNum(p.targetAmount)} ({p.progress}٪)
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </RoleGate>
  );
}
