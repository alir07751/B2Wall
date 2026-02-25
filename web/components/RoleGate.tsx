'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoAuth } from '@/lib/demo-auth';
import type { DemoRole } from '@/lib/types';

/**
 * Client-side route guard for demo. Redirects to /login if role not allowed.
 */
export function RoleGate({
  allowed,
  children,
}: {
  allowed: DemoRole[];
  children: React.ReactNode;
}) {
  const { role } = useDemoAuth();
  const router = useRouter();
  const allowedSet = new Set(allowed);
  const hasAccess = role != null && allowedSet.has(role);

  useEffect(() => {
    if (!hasAccess) {
      router.replace('/login?message=' + encodeURIComponent('برای مشاهده این صفحه وارد شوید.'));
    }
  }, [hasAccess, router]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-muted">در حال انتقال به صفحه ورود…</p>
      </div>
    );
  }

  return <>{children}</>;
}
