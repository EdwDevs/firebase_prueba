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
import { db } from '@/lib/firebase';
import { useTenantId } from '@/hooks/useTenantId';
import { CashSession } from '@/types';
import { useAuthStore } from '@/store/authStore';

export function useCash() {
  const tenantId = useTenantId();
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const getCashSessionsRef = () => collection(db, 'tenants', tenantId, 'cashSessions');

  // Escuchar sesiones de caja
  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
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
  }, [tenantId]);

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
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado' };
      }
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
        tenantId,
      };

      const sessionRef = await addDoc(getCashSessionsRef(), sessionData);
      return { success: true, sessionId: sessionRef.id };
    } catch (error: any) {
      console.error('Error abriendo turno:', error);
      return { success: false, error: error.message };
    }
  }, [user, activeSession, tenantId]);

  // Cerrar turno
  const closeSession = useCallback(async (
    finalCash: number,
    notes: string = ''
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No autenticado' };
    if (!activeSession) return { success: false, error: 'No hay turno activo' };

    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado' };
      }
      // Calcular totales del turno
      const sessionStart = activeSession.openedAt;
      const ordersRef = collection(db, 'tenants', tenantId, 'orders');
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
  }, [user, activeSession, tenantId]);

  // Obtener resumen del turno actual
  const getSessionSummary = useCallback(async (sessionId: string) => {
    try {
      if (!tenantId) {
        return null;
      }
      const ordersRef = collection(db, 'tenants', tenantId, 'orders');
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
  }, [tenantId]);

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
  const tenantId = useTenantId();
  const [report, setReport] = useState({
    totalSales: 0,
    totalByMethod: { cash: 0, nequi: 0, qr: 0 },
    ordersCount: 0,
    averageTicket: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    const ordersRef = collection(db, 'tenants', tenantId, 'orders');
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
  }, [startDate, endDate, tenantId]);

  return { report, loading };
}
