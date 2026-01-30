'use client';

import { useAuth } from '@/hooks/useAuth';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useAuth();

  return <>{children}</>;
}
