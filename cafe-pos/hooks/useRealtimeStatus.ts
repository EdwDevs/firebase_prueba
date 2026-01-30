'use client';

import { useCallback, useEffect, useState } from 'react';
import { onValue, ref, set } from 'firebase/database';
import { realtimeDb, TENANT_ID } from '@/lib/firebase';

type RealtimeStatus = {
  value: string;
  updatedAt: number;
};

export function useRealtimeStatus(statusKey: string) {
  const [status, setStatus] = useState<RealtimeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const statusRef = ref(realtimeDb, `tenants/${TENANT_ID}/status/${statusKey}`);
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
  }, [statusKey]);

  const updateStatus = useCallback(
    async (value: string) => {
      const nextStatus = {
        value,
        updatedAt: Date.now(),
      };

      await set(ref(realtimeDb, `tenants/${TENANT_ID}/status/${statusKey}`), nextStatus);
      return nextStatus;
    },
    [statusKey]
  );

  return { status, loading, updateStatus };
}
