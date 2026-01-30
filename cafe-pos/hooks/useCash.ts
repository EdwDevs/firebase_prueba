'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db, TENANT_ID } from '@/lib/firebase';
import { CashSession } from '@/types';
import { useAuthStore } from '@/store/authStore';

const getCashSessionsRef = () => collection(db, 'tenants', TENANT_ID, 'cashSessions');

export function useCash() {
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  // Escuchar sesiones de caja
  useEffect(() => {
    const q = query(
      getCashSessionsRef(),
      orderBy('openedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        openedAt: doc.data().openedAt?.toDate(),
        closedAt: doc.data().closedAt?.toDate(),
      })) as CashSession[];
      
      setSessions(sessionsData);
      
      // Encontrar sesión activa
      const active = sessionsData.find((s) => s.isActive);
      setActiveSession(active || null);
      setLoading(false);
    }, (error) => {
      console.error('Error escuchando sesiones de caja:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Abrir turno
  const openSession = useCallback(async (
    initialCash: number = 0,
    notes: string = ''
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
    if (!user) return { success: false, error: 'No autenticado' };
    
    // Verificar si ya hay sesión activa
    if (activeSession) {
      return { success: false, error: 'Ya hay un turno de caja activo' };
    }

    try {
      const sessionData = {
        openedAt: serverTimestamp(),
        openedBy: user.id,
        openedByName: user.displayName,
        initialCash,
        closedAt: null,
        closedBy: null,
        closedByName: null,
        finalCash: null,
        expectedCash: null,
        cashDifference: null,
        totalSales: 0,
        totalByMethod: {
          cash: 0,
          nequi: 0,
          qr: 0,
        },
        ordersCount: 0,
        notes,
        isActive: true,
        tenantId: TENANT_ID,
      };

      const sessionRef = await addDoc(getCashSessionsRef(), sessionData);
      return { success: true, sessionId: sessionRef.id };
    } catch (error: any) {
      console.error('Error abriendo turno:', error);
      return { success: false, error: error.message };
    }
  }, [user, activeSession]);

  // Cerrar turno
  const closeSession = useCallback(async (
    finalCash: number,
    notes: string = ''
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No autenticado' };
    if (!activeSession) return { success: false, error: 'No hay turno activo' };

    try {
      // Calcular totales del turno
      const sessionStart = activeSession.openedAt;
      const ordersRef = collection(db, 'tenants', TENANT_ID, 'orders');
      const q = query(
        ordersRef,
        where('cashSessionId', '==', activeSession.id),
        where('status', '==', 'paid')
      );
      
      const ordersSnapshot = await getDocs(q);
      
      let totalSales = 0;
      const totalByMethod = { cash: 0, nequi: 0, qr: 0 };
      
      ordersSnapshot.docs.forEach((doc) => {
        const order = doc.data();
        totalSales += order.totalAmount;
        if (order.paymentMethod) {
          totalByMethod[order.paymentMethod] += order.totalAmount;
        }
      });

      const expectedCash = activeSession.initialCash + totalByMethod.cash;
      const cashDifference = finalCash - expectedCash;

      const sessionRef = doc(getCashSessionsRef(), activeSession.id);
      await updateDoc(sessionRef, {
        closedAt: serverTimestamp(),
        closedBy: user.id,
        closedByName: user.displayName,
        finalCash,
        expectedCash,
        cashDifference,
        totalSales,
        totalByMethod,
        ordersCount: ordersSnapshot.size,
        notes: notes || activeSession.notes,
        isActive: false,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error cerrando turno:', error);
      return { success: false, error: error.message };
    }
  }, [user, activeSession]);

  // Obtener resumen del turno actual
  const getSessionSummary = useCallback(async (sessionId: string) => {
    try {
      const ordersRef = collection(db, 'tenants', TENANT_ID, 'orders');
      const q = query(
        ordersRef,
        where('cashSessionId', '==', sessionId),
        where('status', '==', 'paid')
      );
      
      const ordersSnapshot = await getDocs(q);
      
      let totalSales = 0;
      const totalByMethod = { cash: 0, nequi: 0, qr: 0 };
      
      ordersSnapshot.docs.forEach((doc) => {
        const order = doc.data();
        totalSales += order.totalAmount;
        if (order.paymentMethod) {
          totalByMethod[order.paymentMethod] += order.totalAmount;
        }
      });

      return {
        totalSales,
        totalByMethod,
        ordersCount: ordersSnapshot.size,
      };
    } catch (error) {
      console.error('Error obteniendo resumen:', error);
      return null;
    }
  }, []);

  return {
    sessions,
    activeSession,
    loading,
    openSession,
    closeSession,
    getSessionSummary,
    hasActiveSession: !!activeSession,
  };
}

// Hook para reportes de ventas
export function useSalesReport(startDate: Date, endDate: Date) {
  const [report, setReport] = useState({
    totalSales: 0,
    totalByMethod: { cash: 0, nequi: 0, qr: 0 },
    ordersCount: 0,
    averageTicket: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ordersRef = collection(db, 'tenants', TENANT_ID, 'orders');
    const q = query(
      ordersRef,
      where('status', '==', 'paid'),
      where('paidAt', '>=', Timestamp.fromDate(startDate)),
      where('paidAt', '<=', Timestamp.fromDate(endDate))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalSales = 0;
      const totalByMethod = { cash: 0, nequi: 0, qr: 0 };
      
      snapshot.docs.forEach((doc) => {
        const order = doc.data();
        totalSales += order.totalAmount;
        if (order.paymentMethod) {
          totalByMethod[order.paymentMethod] += order.totalAmount;
        }
      });

      const ordersCount = snapshot.size;
      const averageTicket = ordersCount > 0 ? totalSales / ordersCount : 0;

      setReport({
        totalSales,
        totalByMethod,
        ordersCount,
        averageTicket,
      });
      setLoading(false);
    }, (error) => {
      console.error('Error obteniendo reporte:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [startDate, endDate]);

  return { report, loading };
}
