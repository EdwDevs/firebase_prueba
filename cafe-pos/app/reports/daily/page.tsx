'use client';

import { useState } from 'react';
import { BarChart3, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useSalesReport } from '@/hooks/useCash';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Navbar } from '@/components/shared/Navbar';
import { formatPrice, formatDate } from '@/lib/utils';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export default function DailyReportPage() {
  const [startDate, setStartDate] = useState<string>(
    subDays(new Date(), 7).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const { report, loading } = useSalesReport(
    startOfDay(new Date(startDate)),
    endOfDay(new Date(endDate))
  );

  const handleExportCSV = () => {
    // Aquí iría la lógica de exportación CSV
    alert('Exportación CSV - Funcionalidad en desarrollo');
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold">Reporte de Ventas</h1>
                  <p className="text-gray-500">Análisis de ventas por período</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                <Download size={18} />
                Exportar CSV
              </Button>
            </div>

            {/* Filtros */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha inicial
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha final
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStartDate(subDays(new Date(), 7).toISOString().split('T')[0]);
                      setEndDate(new Date().toISOString().split('T')[0]);
                    }}
                  >
                    Últimos 7 días
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setStartDate(today);
                      setEndDate(today);
                    }}
                  >
                    Hoy
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Ventas totales</p>
                  <p className="text-2xl font-bold">{formatPrice(report.totalSales)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Órdenes</p>
                  <p className="text-2xl font-bold">{report.ordersCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Ticket promedio</p>
                  <p className="text-2xl font-bold">{formatPrice(report.averageTicket)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Período</p>
                  <p className="text-lg font-medium">
                    {formatDate(new Date(startDate))} - {formatDate(new Date(endDate))}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Desglose por método */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">💵</span>
                      <div>
                        <p className="font-medium">Efectivo</p>
                        <p className="text-sm text-gray-500">
                          {report.totalSales > 0 
                            ? Math.round((report.totalByMethod.cash / report.totalSales) * 100) 
                            : 0}% del total
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold">{formatPrice(report.totalByMethod.cash)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📱</span>
                      <div>
                        <p className="font-medium">Nequi</p>
                        <p className="text-sm text-gray-500">
                          {report.totalSales > 0 
                            ? Math.round((report.totalByMethod.nequi / report.totalSales) * 100) 
                            : 0}% del total
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold">{formatPrice(report.totalByMethod.nequi)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📲</span>
                      <div>
                        <p className="font-medium">QR</p>
                        <p className="text-sm text-gray-500">
                          {report.totalSales > 0 
                            ? Math.round((report.totalByMethod.qr / report.totalSales) * 100) 
                            : 0}% del total
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold">{formatPrice(report.totalByMethod.qr)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
