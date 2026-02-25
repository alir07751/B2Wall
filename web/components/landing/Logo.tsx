'use client';

import Link from 'next/link';
import { fa } from '@/strings/fa';

type Props = {
  className?: string;
};

/**
 * لوگوی B2Wall (۱۶۰۰×۳۲۰) — برای هدر لندینگ، ابعاد استاندارد.
 */
export function Logo({ className = '' }: Props) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center no-underline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 ${className}`}
      aria-label={fa.brand}
    >
      <img
        src="/logo.svg"
        alt={fa.brand}
        className="h-10 w-auto object-contain object-left sm:h-12"
        width={1600}
        height={320}
      />
    </Link>
  );
}
