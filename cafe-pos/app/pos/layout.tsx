'use client';

import { Navbar } from '@/components/shared/Navbar';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'cashier', 'waiter']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
