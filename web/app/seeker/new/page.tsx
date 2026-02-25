'use client';

import Link from 'next/link';
import { useDemoAuth } from '@/lib/demo-auth';
import { getProjectsForSeeker } from '@/lib/store';
import { SeekerWizard } from './SeekerWizard';
import { RoleGate } from '@/components/RoleGate';

export default function SeekerNewPage() {
  const { user } = useDemoAuth();
  const seekerProjects = user ? getProjectsForSeeker(user.id) : [];
  const seekerHistory = seekerProjects.filter((p) => ['funded', 'repaying', 'completed'].includes(p.status)).length;

  return (
    <RoleGate allowed={['seeker', 'admin']}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-white px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800">ثبت پروژه جدید</h1>
            <Link href="/seeker/dashboard" className="text-sm text-primary hover:underline">داشبورد</Link>
          </div>
        </header>
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
          {user ? <SeekerWizard seekerId={user.id} seekerHistory={seekerHistory} /> : null}
        </main>
      </div>
    </RoleGate>
  );
}
