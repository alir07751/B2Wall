import type { Metadata } from 'next';
import { DemoAuthProvider } from '@/lib/demo-auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'B2Wall — بازار سرمایه پروژه‌محور',
  description: 'بازاری برای مبادله سرمایه بر اساس پروژه‌ها؛ ضمانت و بازپرداخت شفاف.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen font-vazir antialiased">
        <DemoAuthProvider>
          {children}
        </DemoAuthProvider>
      </body>
    </html>
  );
}
