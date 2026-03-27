'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarCheck, ClipboardList, Settings, Flame } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Today', href: `/day/${new Date().toISOString().split('T')[0]}`, icon: CalendarCheck },
  { label: 'Check-In', href: '/checkin', icon: ClipboardList },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ streak = 0 }: { streak?: number }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-inverse-surface flex flex-col py-6 z-50">
      <div className="px-6 mb-10">
        <h1 className="text-lg font-bold text-white tracking-tighter">Tech Lead Console</h1>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">
          Productivity Audit
        </p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mx-2 px-4 py-2.5 flex items-center gap-3 text-sm font-medium tracking-tight rounded-md transition-all duration-150 ${
                isActive
                  ? 'bg-primary-container text-white scale-[0.97]'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-white">
            <Flame size={16} fill="currentColor" />
          </div>
          <div>
            <p className="text-white text-xs font-bold">
              Streak: {streak} Day{streak !== 1 ? 's' : ''}
            </p>
            <p className="text-[10px] text-white/40">Keep it going</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
