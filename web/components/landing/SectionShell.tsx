'use client';

type Props = {
  children: React.ReactNode;
  title?: string;
  id?: string;
  className?: string;
  ariaLabel?: string;
};

/** Wrapper برای سکشن‌های لندینگ: max-width یکسان، فاصله، اختیاری تیتر */
export function SectionShell({ children, title, id, className = '', ariaLabel }: Props) {
  return (
    <section
      id={id}
      className={`max-w-6xl mx-auto w-full px-4 py-6 ${className}`}
      aria-label={ariaLabel ?? title}
    >
      {title && (
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
