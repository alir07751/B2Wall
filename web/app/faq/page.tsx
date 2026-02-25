import { HeaderNav, LandingFooter, FaqSection } from '@/components/landing';

export const metadata = {
  title: 'سوالات متداول | B2Wall',
  description: 'پاسخ سوالات رایج در مورد پلتفرم B2Wall',
};

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="sticky top-0 z-30 border-b border-border bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <HeaderNav />
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
}
