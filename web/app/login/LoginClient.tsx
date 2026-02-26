'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDemoAuth } from '@/lib/demo-auth';
import { fa } from '@/strings/fa';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/investor/dashboard';
  const { loginWithMobile } = useDemoAuth();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function normalizeMobile(v: string) {
    return v.replace(/\D/g, '').slice(-11);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = normalizeMobile(mobile);
    if (raw.length < 10) {
      setError('شماره موبایل معتبر وارد کنید.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // در صورت داشتن API بررسی کاربر: اینجا فراخوانی کنید؛
      // اگر کاربر وجود داشت → پنل، وگرنه → ساخت پروفایل
      const mobileForStorage = raw.startsWith('0') ? raw : `0${raw}`;
      loginWithMobile(mobileForStorage);

      // فعلاً همه را به پنل می‌بریم؛ بعداً می‌توان به API وابسته کرد و در صورت نبودن کاربر به /seeker/new یا /onboarding ریدایرکت کرد.
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('خطا در ورود. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm">
        <p className="text-center text-slate-700 mb-4">{fa.loginPageInstruction}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-slate-700 mb-1">
              {fa.loginMobileLabel}
            </label>
            <input
              id="mobile"
              type="tel"
              inputMode="numeric"
              placeholder={fa.loginMobilePlaceholder}
              value={mobile}
              onChange={(e) => setMobile(normalizeMobile(e.target.value))}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-white text-slate-800 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              dir="ltr"
              autoComplete="tel"
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {loading ? 'در حال ورود...' : fa.loginSubmit}
          </button>
        </form>
        <p className="text-center mt-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            {fa.loginBackHome}
          </Link>
        </p>
      </div>
    </div>
  );
}
