'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useTenantId() {
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMemo(() => tenantId, [tenantId]);
}
