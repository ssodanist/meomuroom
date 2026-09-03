'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: '홈', icon: '🏡' },
  { href: '/communities', label: '커뮤니티', icon: '🌿' },
  { href: '/meetups', label: '모임', icon: '📅' },
  { href: '/discussions', label: '토론', icon: '💬' },
  { href: '/mypage', label: '마이', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/onboarding') return null;

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t border-moss-100 bg-white lg:max-w-[720px]">
      <ul className="flex items-stretch justify-between">
        {tabs.map((tab) => {
          const active =
            tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex min-h-touch flex-col items-center justify-center gap-1 py-2 text-sm font-medium ${
                  active ? 'text-moss-700' : 'text-ink-700/60'
                }`}
              >
                <span aria-hidden className="text-xl">
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
