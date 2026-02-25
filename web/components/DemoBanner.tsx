'use client';

import Link from 'next/link';
import { useDemoAuth } from '@/lib/demo-auth';
import { RoleSwitcher } from './RoleSwitcher';

export function DemoBanner() {
  const { user, logout } = useDemoAuth();

  return (
    <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="font-medium text-amber-900">
        حالت دمو — بدون دیتابیس و احراز هویت واقعی
      </span>
      <div className="flex items-center gap-3">
        <RoleSwitcher />
        {user ? (
          <>
            <span className="text-amber-800">
              {user.name} ({user.role})
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-amber-800 underline hover:no-underline"
            >
              خروج
            </button>
          </>
        ) : (
          <Link href="/login" className="text-amber-800 underline hover:no-underline">
            ورود
          </Link>
        )}
      </div>
    </div>
  );
}
