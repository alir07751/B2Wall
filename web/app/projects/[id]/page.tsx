import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject, getState } from '@/lib/store';
import { formatFaNum, formatFaPct } from '@/lib/utils';
import { ReturnCalculationPanel } from './ReturnCalculationPanel';

const GUARANTEE_LABELS: Record<string, string> = {
  Collateral: 'وثیقه',
  Buyback: 'بازخرید',
  Insurance: 'بیمه',
  Personal: 'ضامن حقیقی',
  None: 'بدون ضمانت',
};

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const seekerPriorFunded = getState().projects.filter(
    (p) => p.seekerId === project.seekerId && p.id !== project.id && ['funded', 'repaying', 'completed'].includes(p.status)
  ).length;
  const isNewSeeker = seekerPriorFunded === 0;

  const durationMonths = Math.round(project.durationDays / 30);
  const progress = project.progress ?? Math.min(100, (project.fundedAmount / project.targetAmount) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-white px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-slate-800">B2Wall</a>
          <Link href="/projects" className="text-sm text-primary hover:underline">بازگشت به لیست</Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
        <section className="rounded-lg border border-border bg-white p-4">
          <h1 className="text-lg font-bold text-slate-800 mb-4">{project.title}</h1>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted">بازده مورد انتظار</p>
              <p className="font-bold font-tabular text-lg">{formatFaPct(project.expectedReturnAPR)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">مدت</p>
              <p className="font-bold font-tabular">{durationMonths} ماه</p>
            </div>
            <div>
              <p className="text-xs text-muted">نوع ضمانت</p>
              <p className="font-semibold">{GUARANTEE_LABELS[project.guaranteeType] ?? project.guaranteeType}</p>
            </div>
            <div>
              <p className="text-xs text-muted">رتبه ریسک</p>
              <p className="font-semibold">ریسک {project.riskTier}</p>
            </div>
            <div>
              <p className="text-xs text-muted">حداقل مشارکت</p>
              <p className="font-bold font-tabular">{formatFaNum(project.minAllocation)} ریال</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-white p-4">
          <h2 className="font-bold text-slate-800 mb-2">پیشرفت جذب</h2>
          <div className="h-3 bg-slate-200 rounded overflow-hidden">
            <div
              className="h-full bg-primary rounded"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="text-sm font-tabular mt-1">
            {formatFaNum(project.fundedAmount)} از {formatFaNum(project.targetAmount)} ریال ({formatFaPct(progress)})
          </p>
          <p className="text-xs text-muted">{project.backersCount ?? 0} سرمایه‌گذار</p>
        </section>

        <section className="rounded-lg border border-border bg-white p-4">
          <h2 className="font-bold text-slate-800 mb-2">هدف پروژه</h2>
          <p className="text-sm text-slate-700">{project.purpose}</p>
          {project.description && (
            <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{project.description}</p>
          )}
        </section>

        <section className="rounded-lg border border-border bg-white p-4">
          <h2 className="font-bold text-slate-800 mb-2">ضمانت</h2>
          <p className="text-sm">{GUARANTEE_LABELS[project.guaranteeType] ?? project.guaranteeType}</p>
          {project.guaranteeDetails && (
            <p className="text-sm text-muted mt-1">{project.guaranteeDetails}</p>
          )}
          {project.guaranteeTrigger && (
            <p className="text-xs text-muted mt-2">شرایط فعال‌سازی: {project.guaranteeTrigger}</p>
          )}
        </section>

        {project.repayments && project.repayments.length > 0 && (
          <section className="rounded-lg border border-border bg-white p-4">
            <h2 className="font-bold text-slate-800 mb-2">برنامه بازپرداخت</h2>
            <ul className="space-y-1 text-sm">
              {project.repayments.map((r) => (
                <li key={r.id} className="flex justify-between font-tabular">
                  <span>{new Date(r.dueDate).toLocaleDateString('fa-IR')}</span>
                  <span>{formatFaNum(r.amount)} ریال</span>
                  <span className="text-muted">{r.status}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ReturnCalculationPanel
          expectedReturnAPR={project.expectedReturnAPR}
          durationDays={project.durationDays}
          minAllocation={project.minAllocation}
        />

        <section className="rounded-lg border border-border bg-white p-4">
          <h2 className="font-bold text-slate-800 mb-2">مدارک و تأیید</h2>
          <p className="text-sm text-muted">محل نمایش مدارک پروژه و وضعیت تأیید (در نسخه بعد فعال می‌شود).</p>
        </section>

        {project.seeker && (
          <section className="rounded-lg border border-border bg-white p-4">
            <h2 className="font-bold text-slate-800 mb-1">سازنده پروژه</h2>
            <p className="text-sm">{project.seeker.name ?? '—'}</p>
            {isNewSeeker ? (
              <p className="text-xs text-muted mt-1">سازنده جدید — اولین پروژه این سازنده؛ معیارهای ضمانت و بازپرداخت را ببینید.</p>
            ) : (
              <p className="text-xs text-muted mt-1">تعداد پروژه‌های تأمین‌شده قبلی: {seekerPriorFunded}</p>
            )}
          </section>
        )}

        {project.status === 'funding' && (
          <div className="sticky bottom-0 py-4 bg-white border-t border-border">
            <Link
              href={`/invest/${project.id}`}
              className="block w-full text-center py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold"
            >
              سرمایه‌گذاری در این پروژه
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
