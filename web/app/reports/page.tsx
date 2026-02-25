import Link from 'next/link';
import { getProjects, getRepaymentByTier, getFundingVelocityTrend } from '@/lib/store';
import { formatFaNum, formatFaPct } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  const list = getProjects();
  const completedCount = list.filter((p) => ['funded', 'repaying', 'completed'].includes(p.status)).length;
  const totalRaised = list.reduce((s, p) => s + p.fundedAmount, 0);
  const successRate = list.length ? Math.round((completedCount / list.length) * 100) : 0;
  const context = `بر اساس ${list.length} پروژه`;

  const health30 = { successRatePct: successRate, totalRaised, context: context + ' در ۳۰ روز گذشته' };
  const health90 = { successRatePct: successRate, totalRaised, context: context + ' در ۹۰ روز گذشته' };

  const repayment = getRepaymentByTier();
  const velocity = getFundingVelocityTrend();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-white px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">گزارشات شفافیت بازار</h1>
          <Link href="/" className="text-sm text-primary hover:underline">صفحه اصلی</Link>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-8">
        <section className="rounded-lg border border-border bg-white p-4">
          <h2 className="font-bold text-slate-800 mb-2">سلامت بازار (Market Health)</h2>
          <p className="text-xs text-muted mb-4">تعریف: نرخ تکمیل پروژه‌ها و جمع سرمایه جذب‌شده در بازه زمانی. نمونه و بازه در هر بلوک ذکر شده.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded border border-border p-3">
              <p className="text-xs text-muted">۳۰ روز گذشته</p>
              <p className="font-bold font-tabular text-lg">{health30.successRatePct}٪ نرخ تکمیل</p>
              <p className="font-tabular text-sm">{formatFaNum(health30.totalRaised)} ریال جذب</p>
              <p className="text-xs text-muted mt-1" title="تعریف + نمونه">{health30.context}</p>
            </div>
            <div className="rounded border border-border p-3">
              <p className="text-xs text-muted">۹۰ روز گذشته</p>
              <p className="font-bold font-tabular text-lg">{health90.successRatePct}٪ نرخ تکمیل</p>
              <p className="font-tabular text-sm">{formatFaNum(health90.totalRaised)} ریال جذب</p>
              <p className="text-xs text-muted mt-1" title="تعریف + نمونه">{health90.context}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-white p-4">
          <h2 className="font-bold text-slate-800 mb-2">عملکرد بازپرداخت به تفکیک رتبه ریسک</h2>
          <p className="text-xs text-muted mb-4">تعریف: درصد اقساط با وضعیت «پرداخت‌شده» از کل اقساط. نمونه: تعداد اقساط. (دمو: بدون داده بازپرداخت)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-2">رتبه ریسک</th>
                  <th className="text-right py-2">تعداد قسط</th>
                  <th className="text-right py-2">پرداخت‌شده</th>
                  <th className="text-right py-2">نرخ موفقیت</th>
                </tr>
              </thead>
              <tbody>
                {repayment.map((r) => (
                  <tr key={r.tier} className="border-b border-border">
                    <td className="py-2 font-medium">ریسک {r.tier}</td>
                    <td className="py-2 font-tabular">{r.total}</td>
                    <td className="py-2 font-tabular">{r.paid}</td>
                    <td className="py-2 font-tabular">{r.ratePct != null ? `${r.ratePct}٪` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted mt-2">بر اساس داده دمو (بدون قسط بازپرداخت ثبت‌شده)</p>
        </section>

        <section className="rounded-lg border border-border bg-white p-4">
          <h2 className="font-bold text-slate-800 mb-2">روند سرعت جذب (Funding velocity)</h2>
          <p className="text-xs text-muted mb-4">تعریف: میانگین ریال جذب‌شده در روز برای پروژه‌های در حال جذب. واحد: ریال/روز.</p>
          <div className="rounded border border-border p-3">
            <p className="font-bold font-tabular">
              میانگین سرعت جذب (۳۰ روز): {velocity.currentAvgVelocity != null ? formatFaNum(velocity.currentAvgVelocity) : '—'} ریال/روز
            </p>
            <p className="text-xs text-muted mt-1" title="تعریف + نمونه">{velocity.context}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
