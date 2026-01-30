'use client';

import { useCallback, useEffect, useState } from 'react';
import { onValue, ref, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { useTenantId } from '@/hooks/useTenantId';

type RealtimeStatus = {
  value: string;
  updatedAt: number;
};

export function useRealtimeStatus(statusKey: string) {
  const tenantId = useTenantId();
  const [status, setStatus] = useState<RealtimeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    const statusRef = ref(realtimeDb, `tenants/${tenantId}/status/${statusKey}`);
    const unsubscribe = onValue(
      statusRef,
      (snapshot) => {
        setStatus(snapshot.exists() ? (snapshot.val() as RealtimeStatus) : null);
        setLoading(false);
      },
      (error) => {
        console.error('Error leyendo status en Realtime Database:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [statusKey, tenantId]);

  const updateStatus = useCallback(
    async (value: string) => {
      if (!tenantId) {
        throw new Error('Tenant no configurado.');
      }
      const nextStatus = {
        value,
        updatedAt: Date.now(),
      };

      await set(ref(realtimeDb, `tenants/${tenantId}/status/${statusKey}`), nextStatus);
      return nextStatus;
    },
    [statusKey, tenantId]
  );

  return { status, loading, updateStatus };
}
