'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Armchair, Plus, ShoppingBag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTables } from '@/hooks/useTables';
import { useOrders } from '@/hooks/useOrders';
import { cn, formatPrice } from '@/lib/utils';
import { TABLE_STATUS } from '@/lib/constants';

export default function TablesPage() {
  const { tables, loading, occupiedCount, availableCount } = useTables();
  const { orders } = useOrders();
  
  // Obtener total de orden por mesa
  const getTableOrderTotal = (tableId: string) => {
    const order = orders.find((o) => o.tableId === tableId && o.status === 'open');
    return order?.totalAmount || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesas</h1>
          <p className="text-gray-500">
            {availableCount} disponibles · {occupiedCount} ocupadas
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/pos/takeout">
            <Button variant="outline" className="gap-2">
              <ShoppingBag size={18} />
              Para Llevar
            </Button>
          </Link>
          <Link href="/pos/delivery">
            <Button variant="outline" className="gap-2">
              <Truck size={18} />
              Domicilio
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid de mesas */}
      <div className="table-grid">
        {tables.map((table) => {
          const isOccupied = table.status === 'occupied';
          const orderTotal = getTableOrderTotal(table.id);

          return (
            <Link
              key={table.id}
              href={isOccupied ? `/pos/table/${table.id}` : `/pos/table/${table.id}?new=true`}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-lg border-2',
                  isOccupied
                    ? 'border-red-300 bg-red-50 hover:bg-red-100'
                    : 'border-green-300 bg-green-50 hover:bg-green-100'
                )}
              >
                <CardContent className="p-4 text-center">
                  <div
                    className={cn(
                      'w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3',
                      isOccupied ? 'bg-red-200' : 'bg-green-200'
                    )}
                  >
                    <Armchair
                      size={32}
                      className={isOccupied ? 'text-red-600' : 'text-green-600'}
                    />
                  </div>
                  <h3 className="font-semibold text-lg">{table.name}</h3>
                  <Badge
                    variant={isOccupied ? 'destructive' : 'success'}
                    className="mt-2"
                  >
                    {TABLE_STATUS[table.status].label}
                  </Badge>
                  {isOccupied && orderTotal > 0 && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      {formatPrice(orderTotal)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
