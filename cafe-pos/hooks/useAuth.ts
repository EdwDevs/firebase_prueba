'use client';

import { useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, DEFAULT_TENANT_ID } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

export function useAuth() {
  const { setUser, setLoading, logout, setAuthError, clearAuthError } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const tenantIdFromClaims = tokenResult.claims.tenantId as string | undefined;
          const tenantId = tenantIdFromClaims ?? DEFAULT_TENANT_ID;

          const getDisplayName = () =>
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            'Usuario';

          const buildUserFromDoc = (
            userData: Partial<Omit<User, 'id'>> & {
              createdAt?: { toDate?: () => Date } | Date;
            }
          ): User => ({
            id: firebaseUser.uid,
            email: userData.email ?? firebaseUser.email ?? '',
            displayName: userData.displayName ?? getDisplayName(),
            role: userData.role ?? 'waiter',
            isActive: userData.isActive ?? true,
            createdAt: userData.createdAt?.toDate?.() ?? userData.createdAt ?? new Date(),
            tenantId: userData.tenantId ?? tenantId,
          });

          if (!tenantId) {
            setAuthError('No hay tenant configurado para este usuario.');
            setUser(null);
            return;
          }

          // Obtener datos del usuario desde Firestore
          const userDoc = await getDoc(
            doc(db, 'tenants', tenantId, 'users', firebaseUser.uid)
          );
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Partial<Omit<User, 'id'>> & {
              createdAt?: { toDate?: () => Date };
            };
            setUser(buildUserFromDoc(userData));
            setAuthError(null);
          } else {
            const provisionData = {
              displayName: getDisplayName(),
              role: 'waiter' as const,
              tenantId,
            };

            try {
              await setDoc(doc(db, 'tenants', tenantId, 'users', firebaseUser.uid), provisionData);
              setUser(
                buildUserFromDoc({
                  ...provisionData,
                  email: firebaseUser.email ?? '',
                  isActive: true,
                  createdAt: new Date(),
                })
              );
              setAuthError(null);
            } catch (error: any) {
              console.error('Usuario no encontrado en Firestore y falló el provisioning:', error);
              const message =
                error?.code === 'permission-denied'
                  ? 'No tienes permisos para crear tu perfil. Contacta al administrador.'
                  : 'No se pudo crear tu perfil. Verifica el tenant y tus permisos.';
              setAuthError(message);
              setUser(null);
            }
          }
        } catch (error: any) {
          console.error('Error cargando datos de usuario:', error);
          const message =
            error?.code === 'permission-denied'
              ? 'No tienes permisos para acceder a este tenant o usuario no provisionado.'
              : 'No pudimos cargar tu perfil. Intenta de nuevo o contacta soporte.';
          setAuthError(message);
          setUser(null);
        }
      } else {
        logout();
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading, logout, setAuthError]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      clearAuthError();
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al iniciar sesión' 
      };
    }
  }, [clearAuthError]);

  const logoutUser = useCallback(async () => {
    try {
      await signOut(auth);
      clearAuthError();
      logout();
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al cerrar sesión' 
      };
    }
  }, [clearAuthError, logout]);

  return {
    login,
    logout: logoutUser,
  };
}
