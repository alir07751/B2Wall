import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/lib/store';
import { InvestFlow } from '@/components/InvestFlow';
import { RoleGate } from '@/components/RoleGate';

export const dynamic = 'force-dynamic';

export default async function InvestPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProject(projectId);

  if (!project) notFound();
  if (project.status !== 'funding') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-slate-600 mb-4">این پروژه در مرحله جذب سرمایه نیست.</p>
        <Link href={`/projects/${projectId}`} className="text-primary hover:underline">بازگشت به پروژه</Link>
      </div>
    );
  }

  const projectForInvest = {
    id: project.id,
    title: project.title,
    minAllocation: project.minAllocation,
    targetAmount: project.targetAmount,
    expectedReturnAPR: project.expectedReturnAPR,
    durationDays: project.durationDays,
    guaranteeType: project.guaranteeType,
    guaranteeTrigger: project.guaranteeTrigger,
    riskTier: project.riskTier,
    fundedAmount: project.fundedAmount,
  };

  return (
    <RoleGate allowed={['investor', 'admin']}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-slate-800">B2Wall</Link>
            <Link href={`/projects/${projectId}`} className="text-sm text-primary hover:underline">انصراف و بازگشت</Link>
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          <InvestFlow project={projectForInvest} />
        </main>
      </div>
    </RoleGate>
  );
}
