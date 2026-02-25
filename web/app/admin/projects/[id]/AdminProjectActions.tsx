'use client';

import { useRouter } from 'next/navigation';
import { updateProjectStatus } from '@/lib/store';
import type { ProjectStatus } from '@/lib/types';

export function AdminProjectActions({
  projectId,
  currentStatus,
  canChangeStatus,
}: {
  projectId: string;
  currentStatus: string;
  canChangeStatus: boolean;
}) {
  const router = useRouter();

  function setStatus(status: string) {
    const res = updateProjectStatus(projectId, status as ProjectStatus);
    if (res.ok) {
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-white p-4">
      <h3 className="font-bold text-slate-800 mb-2">تغییر وضعیت</h3>
      {!canChangeStatus && (
        <p className="text-sm text-muted mb-2">پس از شروع جذب، وضعیت قفل می‌شود (عدم تغییر شرایط).</p>
      )}
      <div className="flex flex-wrap gap-2">
        {currentStatus === 'pending' && canChangeStatus && (
          <>
            <button
              type="button"
              onClick={() => setStatus('approved')}
              className="px-3 py-1.5 rounded bg-primary text-white text-sm"
            >
              تأیید و شروع جذب
            </button>
            <button
              type="button"
              onClick={() => setStatus('draft')}
              className="px-3 py-1.5 rounded border border-border text-sm"
            >
              رد (برگشت به پیش‌نویس)
            </button>
          </>
        )}
        {currentStatus === 'approved' && canChangeStatus && (
          <button
            type="button"
            onClick={() => setStatus('funding')}
            className="px-3 py-1.5 rounded bg-primary text-white text-sm"
          >
            شروع جذب رسمی
          </button>
        )}
      </div>
    </section>
  );
}
