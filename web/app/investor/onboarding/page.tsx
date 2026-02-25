'use client';

import { useDemoAuth } from '@/lib/demo-auth';
import { getRiskProfile } from '@/lib/store';
import { RoleGate } from '@/components/RoleGate';
import { InvestorOnboardingForm } from './InvestorOnboardingForm';

export default function InvestorOnboardingPage() {
  const { user } = useDemoAuth();
  const initialRiskProfile = user ? getRiskProfile(user.id) : undefined;

  return (
    <RoleGate allowed={['investor', 'admin']}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-white px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-slate-800">تنظیمات سرمایه‌گذار</h1>
            <p className="text-sm text-muted">ترجیح ریسک خود را انتخاب کنید (KYC-lite placeholder).</p>
          </div>
        </header>
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
          <InvestorOnboardingForm initialRiskProfile={initialRiskProfile} />
        </main>
      </div>
    </RoleGate>
  );
}
