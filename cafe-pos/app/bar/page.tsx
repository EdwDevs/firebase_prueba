'use client';

import { useEffect, useState } from 'react';
import { Coffee, Check, Volume2, VolumeX, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useBar } from '@/hooks/useBar';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Navbar } from '@/components/shared/Navbar';
import { cn, formatTime } from '@/lib/utils';
import { ORDER_TYPES } from '@/lib/constants';

export default function BarPage() {
  const { preparingTickets, readyTickets, loading, markReady, markPreparing } = useBar();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previousCount, setPreviousCount] = useState(0);

  // Sonido de notificación
  useEffect(() => {
    if (soundEnabled && preparingTickets.length > previousCount && previousCount > 0) {
      playNotificationSound();
    }
    setPreviousCount(preparingTickets.length);
  }, [preparingTickets.length, soundEnabled, previousCount]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Segundo beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.3);
      }, 150);
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  };

  const TicketCard = ({ 
    ticket, 
    isReady 
  }: { 
    ticket: typeof preparingTickets[0]; 
    isReady?: boolean 
  }) => {
    const getIdentifier = () => {
      if (ticket.orderType === 'table') {
        return ticket.tableName;
      }
      const phone = ticket.customerPhone ? `(${ticket.customerPhone})` : '';
      if (ticket.orderType === 'delivery') {
        return `${ticket.customerName} ${phone}`;
      }
      return `${ticket.customerName} ${phone}`;
    };

    return (
      <Card className={cn(
        'transition-all',
        isReady ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <Badge 
                variant={ticket.orderType === 'table' ? 'default' : ticket.orderType === 'takeout' ? 'secondary' : 'destructive'}
                className="mb-2"
              >
                {ORDER_TYPES[ticket.orderType].label}
              </Badge>
              <h3 className="font-bold text-lg">{getIdentifier()}</h3>
              {ticket.orderType === 'delivery' && ticket.customerAddress && (
                <p className="text-sm text-gray-600 mt-1">{ticket.customerAddress}</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock size={14} />
              {formatTime(ticket.sentToBarAt)}
            </div>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Coffee size={18} />
              <span className="font-medium">
                {ticket.quantity}x {ticket.productName}
              </span>
            </div>
            {ticket.modifiers && (
              <p className="text-sm text-gray-600 ml-6">{ticket.modifiers}</p>
            )}
            {ticket.notes && (
              <p className="text-sm text-amber-600 ml-6 mt-1 italic">
                Nota: {ticket.notes}
              </p>
            )}
          </div>
          
          <div className="mt-4">
            {isReady ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markPreparing(ticket.id)}
                className="w-full"
              >
                Volver a Preparando
              </Button>
            ) : (
              <Button
                onClick={() => markReady(ticket.id)}
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check size={18} />
                Marcar Listo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'cashier', 'waiter']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Coffee className="w-8 h-8 text-amber-600" />
                <div>
                  <h1 className="text-2xl font-bold">Barra</h1>
                  <p className="text-gray-500">
                    {preparingTickets.length} preparando · {readyTickets.length} listos
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </Button>
            </div>

            {/* Columnas */}
            <div className="bar-columns">
              {/* Preparando */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                  Preparando ({preparingTickets.length})
                </h2>
                <div className="space-y-4">
                  {preparingTickets.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-gray-500">
                        <Coffee className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay bebidas preparándose</p>
                      </CardContent>
                    </Card>
                  ) : (
                    preparingTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))
                  )}
                </div>
              </div>

              {/* Listos */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full" />
                  Listos ({readyTickets.length})
                </h2>
                <div className="space-y-4">
                  {readyTickets.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-gray-500">
                        <Check className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay bebidas listas</p>
                      </CardContent>
                    </Card>
                  ) : (
                    readyTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} isReady />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
