'use client';

import { useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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

          if (!tenantId) {
            setAuthError('No hay tenant configurado para este usuario.');
            logout();
            return;
          }

          // Obtener datos del usuario desde Firestore
          const userDoc = await getDoc(
            doc(db, 'tenants', tenantId, 'users', firebaseUser.uid)
          );
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'> & {
              createdAt?: { toDate?: () => Date };
            };
            setUser({
              id: firebaseUser.uid,
              ...userData,
              tenantId: userData.tenantId ?? tenantId,
              createdAt: userData.createdAt?.toDate?.() ?? userData.createdAt ?? new Date(),
            });
            setAuthError(null);
          } else {
            const displayName =
              firebaseUser.displayName ||
              firebaseUser.email?.split('@')[0] ||
              'Usuario';
            const newUserData: Omit<User, 'id'> = {
              email: firebaseUser.email || '',
              displayName,
              role: 'waiter',
              isActive: true,
              createdAt: new Date(),
              tenantId,
            };

            try {
              await setDoc(doc(db, 'tenants', tenantId, 'users', firebaseUser.uid), {
                ...newUserData,
                createdAt: serverTimestamp(),
              });
              setUser({
                id: firebaseUser.uid,
                ...newUserData,
              });
              setAuthError(null);
            } catch (error) {
              console.error('Usuario no encontrado en Firestore y falló el provisioning:', error);
              setAuthError(
                'No se encontró un perfil en Firestore para este usuario. Verifica el tenant y los permisos.'
              );
              logout();
            }
          }
        } catch (error) {
          console.error('Error cargando datos de usuario:', error);
          setAuthError('No pudimos cargar tu perfil. Intenta de nuevo o contacta soporte.');
          logout();
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
