'use client';

import { useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, TENANT_ID } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

export function useAuth() {
  const { setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Obtener datos del usuario desde Firestore
          const userDoc = await getDoc(
            doc(db, 'tenants', TENANT_ID, 'users', firebaseUser.uid)
          );
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            setUser({
              id: firebaseUser.uid,
              ...userData,
            });
          } else {
            console.error('Usuario no encontrado en Firestore');
            logout();
          }
        } catch (error) {
          console.error('Error cargando datos de usuario:', error);
          logout();
        }
      } else {
        logout();
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading, logout]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al iniciar sesión' 
      };
    }
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await signOut(auth);
      logout();
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al cerrar sesión' 
      };
    }
  }, [logout]);

  return {
    login,
    logout: logoutUser,
  };
}
