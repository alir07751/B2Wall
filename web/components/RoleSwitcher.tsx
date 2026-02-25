'use client';

import { useDemoAuth } from '@/lib/demo-auth';
import type { DemoRole } from '@/lib/types';

const LABELS: Record<DemoRole, string> = {
  investor: 'سرمایه‌گذار',
  seeker: 'پروژه‌ساز',
  admin: 'ادمین',
};

export function RoleSwitcher() {
  const { role, login } = useDemoAuth();

  return (
    <span className="flex items-center gap-1">
      <span className="text-amber-800">نقش:</span>
      {(['investor', 'seeker', 'admin'] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => login(r)}
          className={`px-2 py-0.5 rounded text-xs ${
            role === r ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-900 hover:bg-amber-300'
          }`}
        >
          {LABELS[r]}
        </button>
      ))}
    </span>
  );
}
