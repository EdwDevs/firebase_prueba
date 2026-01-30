'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantId } from '@/hooks/useTenantId';
import { BarTicket } from '@/types';

export function useBar() {
  const tenantId = useTenantId();
  const [tickets, setTickets] = useState<BarTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const getBarTicketsRef = () => collection(db, 'tenants', tenantId, 'barTickets');

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    const q = query(
      getBarTicketsRef(),
      orderBy('sentToBarAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        sentToBarAt: doc.data().sentToBarAt?.toDate(),
        readyAt: doc.data().readyAt?.toDate(),
      })) as BarTicket[];
      
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      console.error('Error escuchando tickets de barra:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Marcar ticket como listo
  const markReady = useCallback(async (ticketId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      const ticketRef = doc(getBarTicketsRef(), ticketId);
      await updateDoc(ticketRef, {
        status: 'ready',
        readyAt: serverTimestamp(),
      });
      
      // También actualizar el item de la orden
      // Nota: Necesitaríamos el orderId y itemId para esto
      // Por ahora lo hacemos en el componente
      
      return { success: true };
    } catch (error: any) {
      console.error('Error marcando como listo:', error);
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  // Marcar ticket como preparando (revertir)
  const markPreparing = useCallback(async (ticketId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      const ticketRef = doc(getBarTicketsRef(), ticketId);
      await updateDoc(ticketRef, {
        status: 'preparing',
        readyAt: null,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error marcando como preparando:', error);
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  // Tickets filtrados por estado
  const preparingTickets = tickets.filter((t) => t.status === 'preparing');
  const readyTickets = tickets.filter((t) => t.status === 'ready');

  return {
    tickets,
    preparingTickets,
    readyTickets,
    loading,
    markReady,
    markPreparing,
  };
}

// Hook para sonido de notificación
export function useBarSound() {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Crear audio context para beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playBeep = () => {
      if (!enabled) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    return { playBeep, setEnabled };
  }, [enabled]);

  return { enabled, setEnabled };
}
