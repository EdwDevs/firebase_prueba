'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Users, Settings, ClipboardList } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/tables', label: 'Mesas', icon: Settings },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/inventory', label: 'Inventario', icon: ClipboardList },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-6">
            {/* Sub-nav de admin */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-white hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
