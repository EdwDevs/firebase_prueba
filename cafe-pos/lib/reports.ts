import { Order } from '@/types';
import { formatDate } from './utils';

export function exportOrdersToCSV(orders: Order[], filename?: string): void {
  if (orders.length === 0) {
    alert('No hay órdenes para exportar');
    return;
  }

  // Headers
  const headers = [
    'Fecha',
    'Tipo',
    'Mesa/Cliente',
    'Teléfono',
    'Dirección',
    'Estado',
    'Método de Pago',
    'Total',
  ];

  // Data rows
  const rows = orders.map((order) => [
    formatDate(order.paidAt || order.createdAt),
    order.type === 'table' ? 'Mesa' : order.type === 'takeout' ? 'Para Llevar' : 'Domicilio',
    order.tableName || order.customerName || '',
    order.customerPhone || '',
    order.customerAddress || '',
    order.status === 'paid' ? 'Pagada' : order.status === 'open' ? 'Abierta' : order.status === 'delivered' ? 'Entregada' : 'Cancelada',
    order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod === 'nequi' ? 'Nequi' : order.paymentMethod === 'qr' ? 'QR' : '',
    order.totalAmount.toString(),
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => 
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `ventas_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateDailyReport(orders: Order[]) {
  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalByMethod = {
    cash: orders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0),
    nequi: orders.filter(o => o.paymentMethod === 'nequi').reduce((sum, o) => sum + o.totalAmount, 0),
    qr: orders.filter(o => o.paymentMethod === 'qr').reduce((sum, o) => sum + o.totalAmount, 0),
  };

  return {
    totalSales,
    totalByMethod,
    ordersCount: orders.length,
    averageTicket: orders.length > 0 ? totalSales / orders.length : 0,
  };
}
