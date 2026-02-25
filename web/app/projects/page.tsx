import { getProjects } from '@/lib/store';
import { ProjectCard } from '@/components/ProjectCard';

export const dynamic = 'force-dynamic';

type SearchParams = { [key: string]: string | string[] | undefined };

export default function BrowsePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const riskTier = typeof searchParams.riskTier === 'string' ? searchParams.riskTier : undefined;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'default';

  let list = getProjects({ riskTier: riskTier || undefined });

  if (sort === 'return') {
    list = [...list].sort((a, b) => b.expectedReturnAPR - a.expectedReturnAPR);
  } else if (sort === 'duration') {
    list = [...list].sort((a, b) => a.durationDays - b.durationDays);
  } else if (sort === 'progress') {
    list = [...list].sort((a, b) => b.progress - a.progress);
  } else if (sort === 'velocity') {
    list = [...list].sort((a, b) => (b.fundingVelocity ?? 0) - (a.fundingVelocity ?? 0));
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-white px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-slate-800">
            B2Wall
          </a>
          <nav className="text-sm text-slate-600">
            <a href="/" className="hover:text-primary">خانه</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <h1 className="text-xl font-bold text-slate-800 mb-4">فرصت‌های سرمایه‌گذاری</h1>

        {/* Filters / sort */}
        <div className="flex flex-wrap gap-2 mb-6 text-sm">
          <span className="text-muted">مرتب‌سازی:</span>
          <a
            href="/projects"
            className="px-3 py-1 rounded border border-border hover:bg-surface"
          >
            پیش‌فرض
          </a>
          <a
            href="/projects?sort=return"
            className="px-3 py-1 rounded border border-border hover:bg-surface"
          >
            بازده
          </a>
          <a
            href="/projects?sort=duration"
            className="px-3 py-1 rounded border border-border hover:bg-surface"
          >
            مدت
          </a>
          <a
            href="/projects?sort=progress"
            className="px-3 py-1 rounded border border-border hover:bg-surface"
          >
            پیشرفت جذب
          </a>
          <a
            href="/projects?sort=velocity"
            className="px-3 py-1 rounded border border-border hover:bg-surface"
          >
            سرعت جذب
          </a>
          <span className="w-full mt-2 text-muted">فیلتر رتبه ریسک:</span>
          <a href="/projects" className="px-3 py-1 rounded border border-border hover:bg-surface">همه</a>
          <a href="/projects?riskTier=A" className="px-3 py-1 rounded border border-border hover:bg-surface">A</a>
          <a href="/projects?riskTier=B" className="px-3 py-1 rounded border border-border hover:bg-surface">B</a>
          <a href="/projects?riskTier=C" className="px-3 py-1 rounded border border-border hover:bg-surface">C</a>
        </div>

        {list.length === 0 ? (
          <p className="text-muted">پروژه‌ای یافت نشد.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {list.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
