'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantId } from '@/hooks/useTenantId';
import { Table } from '@/types';

export function useTables() {
  const tenantId = useTenantId();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const getTablesRef = () => collection(db, 'tenants', tenantId, 'tables');

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    const q = query(
      getTablesRef(),
      orderBy('number', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tablesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Table[];
      
      setTables(tablesData);
      setLoading(false);
    }, (error) => {
      console.error('Error escuchando mesas:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Actualizar estado de mesa
  const updateTableStatus = useCallback(async (
    tableId: string,
    status: Table['status'],
    currentOrderId: string | null = null
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      const tableRef = doc(getTablesRef(), tableId);
      await updateDoc(tableRef, {
        status,
        currentOrderId,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error actualizando mesa:', error);
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  // Obtener mesa por ID
  const getTableById = useCallback((tableId: string): Table | undefined => {
    return tables.find((t) => t.id === tableId);
  }, [tables]);

  // Contar mesas por estado
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;

  return {
    tables,
    loading,
    updateTableStatus,
    getTableById,
    availableCount,
    occupiedCount,
  };
}
