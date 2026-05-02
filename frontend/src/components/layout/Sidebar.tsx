'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard, Sprout, CloudSun, FlaskConical,
  ShoppingBag, Bot, Settings, LogOut, Leaf,
  BarChart3, Users, Shield, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const farmerNav = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/crops',      icon: Sprout,          label: 'My Crops' },
  { href: '/dashboard/weather',    icon: CloudSun,        label: 'Weather' },
  { href: '/dashboard/soil',       icon: FlaskConical,    label: 'Soil Tracker' },
  { href: '/dashboard/ai',         icon: Bot,             label: 'AI Detection' },
  { href: '/dashboard/marketplace',icon: ShoppingBag,     label: 'Marketplace' },
  { href: '/dashboard/settings',   icon: Settings,        label: 'Settings' },
];

const adminNav = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/analytics',      icon: BarChart3,       label: 'Analytics' },
  { href: '/admin/users',          icon: Users,           label: 'Users' },
  { href: '/admin/products',       icon: Shield,          label: 'Moderation' },
  { href: '/dashboard/marketplace',icon: ShoppingBag,     label: 'Marketplace' },
  { href: '/dashboard/settings',   icon: Settings,        label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = user?.role === 'admin' ? adminNav : farmerNav;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <aside className={cn(
      'relative flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-gray-900 dark:text-white">GreenPulse</span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-green-50 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-gray-500" /> : <ChevronLeft className="w-3 h-3 text-gray-500" />}
      </button>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-green-600 text-white shadow-green-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
