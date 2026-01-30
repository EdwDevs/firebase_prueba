'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { DEFAULT_TENANT_ID } from '@/lib/firebase';

export function useTenantId() {
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  return useMemo(() => tenantId ?? DEFAULT_TENANT_ID, [tenantId]);
}
