'use client';

import { useState } from 'react';
import { DollarSign, Play, Square, Receipt, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useCash } from '@/hooks/useCash';
import { useOrders } from '@/hooks/useOrders';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Navbar } from '@/components/shared/Navbar';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/lib/constants';

export default function CashPage() {
  const { activeSession, hasActiveSession, loading, openSession, closeSession } = useCash();
  const { orders } = useOrders();
  const [initialCash, setInitialCash] = useState('');
  const [finalCash, setFinalCash] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);

  // Filtrar órdenes del turno actual
  const sessionOrders = activeSession 
    ? orders.filter(o => o.cashSessionId === activeSession.id && o.status === 'paid')
    : [];

  const handleOpenSession = async () => {
    setIsProcessing(true);
    const result = await openSession(parseInt(initialCash) || 0, notes);
    if (result.success) {
      setInitialCash('');
      setNotes('');
    }
    setIsProcessing(false);
  };

  const handleCloseSession = async () => {
    setIsProcessing(true);
    const result = await closeSession(parseInt(finalCash) || 0, notes);
    if (result.success) {
      setFinalCash('');
      setNotes('');
      setShowCloseForm(false);
    }
    setIsProcessing(false);
  };

  const totalSessionSales = sessionOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const salesByMethod = {
    cash: sessionOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0),
    nequi: sessionOrders.filter(o => o.paymentMethod === 'nequi').reduce((sum, o) => sum + o.totalAmount, 0),
    qr: sessionOrders.filter(o => o.paymentMethod === 'qr').reduce((sum, o) => sum + o.totalAmount, 0),
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'cashier']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold">Caja</h1>
                <p className="text-gray-500">
                  {hasActiveSession 
                    ? `Turno abierto desde ${activeSession ? formatDateTime(activeSession.openedAt) : ''}` 
                    : 'No hay turno activo'}
                </p>
              </div>
            </div>

            {!hasActiveSession ? (
              /* Formulario de apertura */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play size={20} className="text-green-600" />
                    Abrir Turno
                  </CardTitle>
                  <CardDescription>
                    Ingresa el efectivo inicial en caja para comenzar el turno
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Efectivo inicial (COP)"
                    type="number"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label="Notas (opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Turno de la mañana"
                  />
                  <Button 
                    onClick={handleOpenSession} 
                    isLoading={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    <Play size={18} className="mr-2" />
                    Abrir Caja
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Panel de caja activa */
              <div className="space-y-6">
                {/* Resumen del turno */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Ventas del turno</p>
                      <p className="text-2xl font-bold">{formatPrice(totalSessionSales)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Órdenes</p>
                      <p className="text-2xl font-bold">{sessionOrders.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Ticket promedio</p>
                      <p className="text-2xl font-bold">
                        {formatPrice(sessionOrders.length > 0 ? totalSessionSales / sessionOrders.length : 0)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Desglose por método de pago */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt size={20} />
                      Ventas por Método de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">💵</span>
                          <span className="font-medium">Efectivo</span>
                        </div>
                        <span className="text-lg font-bold">{formatPrice(salesByMethod.cash)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📱</span>
                          <span className="font-medium">Nequi</span>
                        </div>
                        <span className="text-lg font-bold">{formatPrice(salesByMethod.nequi)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📲</span>
                          <span className="font-medium">QR</span>
                        </div>
                        <span className="text-lg font-bold">{formatPrice(salesByMethod.qr)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Efectivo esperado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp size={20} />
                      Efectivo en Caja
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Efectivo inicial:</span>
                        <span>{formatPrice(activeSession?.initialCash || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ventas en efectivo:</span>
                        <span>{formatPrice(salesByMethod.cash)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>Efectivo esperado:</span>
                        <span>{formatPrice((activeSession?.initialCash || 0) + salesByMethod.cash)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Botón cerrar turno */}
                {!showCloseForm ? (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowCloseForm(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Square size={18} className="mr-2" />
                    Cerrar Turno
                  </Button>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Cerrar Turno - Arqueo</CardTitle>
                      <CardDescription>
                        Ingresa el efectivo contado en caja para realizar el arqueo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        label="Efectivo contado (COP)"
                        type="number"
                        value={finalCash}
                        onChange={(e) => setFinalCash(e.target.value)}
                        placeholder="0"
                      />
                      {finalCash && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between">
                            <span>Efectivo esperado:</span>
                            <span>{formatPrice((activeSession?.initialCash || 0) + salesByMethod.cash)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Efectivo contado:</span>
                            <span>{formatPrice(parseInt(finalCash) || 0)}</span>
                          </div>
                          <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                            <span>Diferencia:</span>
                            <span className={
                              (parseInt(finalCash) || 0) - ((activeSession?.initialCash || 0) + salesByMethod.cash) >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }>
                              {formatPrice((parseInt(finalCash) || 0) - ((activeSession?.initialCash || 0) + salesByMethod.cash))}
                            </span>
                          </div>
                        </div>
                      )}
                      <Input
                        label="Notas de cierre"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: Todo cuadra perfecto"
                      />
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCloseForm(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleCloseSession} 
                          isLoading={isProcessing}
                          variant="destructive"
                          className="flex-1"
                        >
                          Confirmar Cierre
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
