'use client';
import { Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/reports': 'Reports & Analytics',
  '/customers': 'Customers',
  '/workers': 'Workers',
  '/bookings': 'Bookings',
  '/payments': 'Payments',
  '/categories': 'Categories',
  '/services': 'Services',
  '/coupons': 'Coupons',
  '/notifications': 'Push Notifications',
  '/banners': 'Banners',
  '/support': 'Support Tickets',
  '/settings': 'Settings',
};

export function Header() {
  const pathname = usePathname();
  const base = '/' + pathname.split('/')[1];
  const title = TITLES[base] || 'Admin Panel';

  return (
    <header className="fixed top-0 right-0 left-[260px] h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 z-20">
      <div>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>
        <div className="w-px h-6 bg-slate-200" />
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full" />
          <span className="text-xs font-medium text-slate-600">Live</span>
        </div>
      </div>
    </header>
  );
}
