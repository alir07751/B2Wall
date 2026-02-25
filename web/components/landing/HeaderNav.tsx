'use client';

import { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { fa } from '@/strings/fa';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [{ href: '#contact', label: fa.navContact }] as const;

const INVESTOR_SUBMENU = [{ href: '/', label: fa.navSubShowcase }] as const;

const SEEKER_SUBMENU = [{ href: '/seeker/new', label: fa.navSubRegisterOpportunity }] as const;

function DropdownMenu({
  label,
  items,
  open,
  onToggle,
  onClose,
}: {
  label: string;
  items: readonly { href: string; label: string }[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'inline-flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2',
          open ? 'text-primary bg-primary/10' : 'text-slate-600 hover:text-primary hover:bg-primary/5'
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <ul
          className="absolute top-full right-0 mt-1 min-w-[180px] py-1 rounded-2xl border border-border bg-white shadow-lg list-none m-0 p-0 z-50"
          role="menu"
        >
          {items.map(({ href, label: itemLabel }) => (
            <li key={href} role="none">
              <a
                href={href}
                role="menuitem"
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary rounded-xl mx-1 transition-colors"
              >
                {itemLabel}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function HeaderNav() {
  const [openDropdown, setOpenDropdown] = useState<'investors' | 'seekers' | null>(null);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 w-full" aria-label="منوی اصلی">
      <div className="flex items-center gap-8">
        <Logo />
        <ul className="flex flex-wrap items-center gap-1 md:gap-2 list-none m-0 p-0">
          <li>
            <DropdownMenu
              label={fa.navForInvestors}
              items={INVESTOR_SUBMENU}
              open={openDropdown === 'investors'}
              onToggle={() => setOpenDropdown((v) => (v === 'investors' ? null : 'investors'))}
              onClose={() => setOpenDropdown(null)}
            />
          </li>
          <li>
            <DropdownMenu
              label={fa.navForSeekers}
              items={SEEKER_SUBMENU}
              open={openDropdown === 'seekers'}
              onToggle={() => setOpenDropdown((v) => (v === 'seekers' ? null : 'seekers'))}
              onClose={() => setOpenDropdown(null)}
            />
          </li>
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="text-sm font-medium text-slate-600 hover:text-primary px-3 py-2 rounded-2xl hover:bg-primary/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <a
        href="/login"
        className="inline-flex items-center justify-center min-w-[100px] px-4 py-2.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {fa.login}
      </a>
    </nav>
  );
}
