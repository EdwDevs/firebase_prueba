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
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantId } from '@/hooks/useTenantId';
import { Product, Category, ModifierGroup } from '@/types';

const getTenantCollection = (tenantId: string, ...path: string[]) =>
  collection(db, 'tenants', tenantId, ...path);

export function useProducts() {
  const tenantId = useTenantId();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Escuchar productos
  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    const q = query(
      getTenantCollection(tenantId, 'products'),
      where('isActive', '==', true),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Product[];
      
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error('Error escuchando productos:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Escuchar categorías
  useEffect(() => {
    if (!tenantId) {
      return;
    }
    const q = query(
      getTenantCollection(tenantId, 'categories'),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      
      setCategories(categoriesData);
    }, (error) => {
      console.error('Error escuchando categorías:', error);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Escuchar grupos de modificadores
  useEffect(() => {
    if (!tenantId) {
      return;
    }
    const q = query(
      getTenantCollection(tenantId, 'modifierGroups'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ModifierGroup[];
      
      setModifierGroups(groupsData);
    }, (error) => {
      console.error('Error escuchando modificadores:', error);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Crear producto
  const createProduct = useCallback(async (
    product: Omit<Product, 'id' | 'createdAt' | 'tenantId'>
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      const docRef = await addDoc(getTenantCollection(tenantId, 'products'), {
        ...product,
        tenantId,
        createdAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error('Error creando producto:', error);
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  // Actualizar producto
  const updateProduct = useCallback(async (
    productId: string,
    updates: Partial<Product>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      const productRef = doc(getTenantCollection(tenantId, 'products'), productId);
      await updateDoc(productRef, updates);
      return { success: true };
    } catch (error: any) {
      console.error('Error actualizando producto:', error);
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  // Desactivar producto (soft delete)
  const deactivateProduct = useCallback(async (
    productId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      const productRef = doc(getTenantCollection(tenantId, 'products'), productId);
      await updateDoc(productRef, { isActive: false });
      return { success: true };
    } catch (error: any) {
      console.error('Error desactivando producto:', error);
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  // Obtener productos por categoría
  const getProductsByCategory = useCallback((categoryId: string): Product[] => {
    return products.filter((p) => p.categoryId === categoryId && p.isActive);
  }, [products]);

  // Obtener producto por ID
  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find((p) => p.id === productId);
  }, [products]);

  // Obtener grupos de modificadores de un producto
  const getProductModifiers = useCallback((product: Product): ModifierGroup[] => {
    if (!product.hasModifiers || !product.modifierGroupIds) return [];
    return modifierGroups.filter((g) => product.modifierGroupIds.includes(g.id));
  }, [modifierGroups]);

  // Productos que van a barra
  const barProducts = products.filter((p) => p.sendsToBar && p.isActive);

  return {
    products,
    categories,
    modifierGroups,
    loading,
    createProduct,
    updateProduct,
    deactivateProduct,
    getProductsByCategory,
    getProductById,
    getProductModifiers,
    barProducts,
  };
}

// Hook para admin de categorías
export function useCategories() {
  const tenantId = useTenantId();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!tenantId) {
      return;
    }
    const q = query(
      getTenantCollection(tenantId, 'categories'),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      
      setCategories(categoriesData);
    });

    return () => unsubscribe();
  }, [tenantId]);

  const createCategory = useCallback(async (
    category: Omit<Category, 'id' | 'tenantId'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      await addDoc(getTenantCollection(tenantId, 'categories'), {
        ...category,
        tenantId,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  const updateCategory = useCallback(async (
    categoryId: string,
    updates: Partial<Category>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      const categoryRef = doc(getTenantCollection(tenantId, 'categories'), categoryId);
      await updateDoc(categoryRef, updates);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  const deleteCategory = useCallback(async (
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      await deleteDoc(doc(getTenantCollection(tenantId, 'categories'), categoryId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  return {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

// Hook para grupos de modificadores
export function useModifierGroups() {
  const tenantId = useTenantId();
  const [groups, setGroups] = useState<ModifierGroup[]>([]);

  useEffect(() => {
    if (!tenantId) {
      return;
    }
    const q = query(
      getTenantCollection(tenantId, 'modifierGroups'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ModifierGroup[];
      
      setGroups(groupsData);
    });

    return () => unsubscribe();
  }, [tenantId]);

  const createGroup = useCallback(async (
    group: Omit<ModifierGroup, 'id' | 'tenantId'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      await addDoc(getTenantCollection(tenantId, 'modifierGroups'), {
        ...group,
        tenantId,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  const updateGroup = useCallback(async (
    groupId: string,
    updates: Partial<ModifierGroup>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      const groupRef = doc(getTenantCollection(tenantId, 'modifierGroups'), groupId);
      await updateDoc(groupRef, updates);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  const deleteGroup = useCallback(async (
    groupId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!tenantId) {
        return { success: false, error: 'Tenant no configurado.' };
      }
      await deleteDoc(doc(getTenantCollection(tenantId, 'modifierGroups'), groupId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [tenantId]);

  return {
    groups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
