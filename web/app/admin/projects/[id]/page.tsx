import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/lib/store';
import { formatFaNum, formatFaPct } from '@/lib/utils';
import { AdminProjectActions } from './AdminProjectActions';
import { RoleGate } from '@/components/RoleGate';

export const dynamic = 'force-dynamic';

const GUARANTEE_LABELS: Record<string, string> = {
  Collateral: 'وثیقه',
  Buyback: 'بازخرید',
  Insurance: 'بیمه',
  Personal: 'ضامن حقیقی',
  None: 'بدون ضمانت',
};

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) notFound();

  const progress = project.targetAmount ? Math.min(100, (project.fundedAmount / project.targetAmount) * 100) : 0;
  const canChangeStatus = !['funding', 'funded', 'repaying'].includes(project.status);

  return (
    <RoleGate allowed={['admin']}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/admin/projects" className="text-primary hover:underline">← لیست پروژه‌ها</Link>
            <h1 className="text-xl font-bold text-slate-800">بررسی پروژه</h1>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="font-bold text-slate-800 mb-2">{project.title}</h2>
            <p className="text-sm text-slate-600">{project.purpose}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span>وضعیت: {project.status}</span>
              <span>ریسک {project.riskTier}</span>
              <span>{formatFaPct(project.expectedReturnAPR)} — {project.durationDays} روز</span>
              <span>حداقل {formatFaNum(project.minAllocation)} ریال</span>
            </div>
            <p className="text-sm text-muted mt-2">جذب: {formatFaNum(project.fundedAmount)} / {formatFaNum(project.targetAmount)} ({formatFaPct(progress)})</p>
          </div>

          <AdminProjectActions
            projectId={project.id}
            currentStatus={project.status}
            canChangeStatus={canChangeStatus}
          />

          <section className="rounded-lg border border-border bg-white p-4">
            <h3 className="font-bold text-slate-800 mb-2">مایل‌استون‌ها</h3>
            <p className="text-sm text-muted">بدون مایل‌استون (دمو)</p>
          </section>

          <section className="rounded-lg border border-border bg-white p-4">
            <h3 className="font-bold text-slate-800 mb-2">بازپرداخت‌ها</h3>
            <p className="text-sm text-muted">بدون برنامه بازپرداخت ثبت‌شده (دمو)</p>
          </section>
        </main>
      </div>
    </RoleGate>
  );
}
