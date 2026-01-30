'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Armchair, 
  Coffee, 
  DollarSign, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { ROLES } from '@/lib/constants';

const navItems = [
  { href: '/pos/tables', label: 'POS', icon: Armchair, roles: ['admin', 'cashier', 'waiter'] },
  { href: '/bar', label: 'Barra', icon: Coffee, roles: ['admin', 'cashier', 'waiter'] },
  { href: '/cash', label: 'Caja', icon: DollarSign, roles: ['admin', 'cashier'] },
  { href: '/reports/daily', label: 'Reportes', icon: BarChart3, roles: ['admin'] },
  { href: '/admin/products', label: 'Admin', icon: Settings, roles: ['admin'] },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  if (!user) return null;

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <>
      {/* Navbar móvil */}
      <nav className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="font-semibold text-lg">ProCafees POS</span>
        <div className="w-10" />
      </nav>

      {/* Sidebar desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">ProCafees POS</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-600">{user.displayName}</span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                ROLES[user.role].color
              )}
            >
              {ROLES[user.role].label}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => toggleSidebar()}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-button',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100 text-gray-700'
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-50 text-red-600 transition-colors touch-button"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
