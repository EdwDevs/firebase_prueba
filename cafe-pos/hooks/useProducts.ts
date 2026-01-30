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
import { db, TENANT_ID } from '@/lib/firebase';
import { Product, Category, ModifierGroup } from '@/types';

const getProductsRef = () => collection(db, 'tenants', TENANT_ID, 'products');
const getCategoriesRef = () => collection(db, 'tenants', TENANT_ID, 'categories');
const getModifierGroupsRef = () => collection(db, 'tenants', TENANT_ID, 'modifierGroups');

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Escuchar productos
  useEffect(() => {
    const q = query(
      getProductsRef(),
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
  }, []);

  // Escuchar categorías
  useEffect(() => {
    const q = query(
      getCategoriesRef(),
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
  }, []);

  // Escuchar grupos de modificadores
  useEffect(() => {
    const q = query(
      getModifierGroupsRef(),
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
  }, []);

  // Crear producto
  const createProduct = useCallback(async (
    product: Omit<Product, 'id' | 'createdAt' | 'tenantId'>
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      const docRef = await addDoc(getProductsRef(), {
        ...product,
        tenantId: TENANT_ID,
        createdAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error('Error creando producto:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Actualizar producto
  const updateProduct = useCallback(async (
    productId: string,
    updates: Partial<Product>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const productRef = doc(getProductsRef(), productId);
      await updateDoc(productRef, updates);
      return { success: true };
    } catch (error: any) {
      console.error('Error actualizando producto:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Desactivar producto (soft delete)
  const deactivateProduct = useCallback(async (
    productId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const productRef = doc(getProductsRef(), productId);
      await updateDoc(productRef, { isActive: false });
      return { success: true };
    } catch (error: any) {
      console.error('Error desactivando producto:', error);
      return { success: false, error: error.message };
    }
  }, []);

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
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const q = query(
      getCategoriesRef(),
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
  }, []);

  const createCategory = useCallback(async (
    category: Omit<Category, 'id' | 'tenantId'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await addDoc(getCategoriesRef(), {
        ...category,
        tenantId: TENANT_ID,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const updateCategory = useCallback(async (
    categoryId: string,
    updates: Partial<Category>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const categoryRef = doc(getCategoriesRef(), categoryId);
      await updateDoc(categoryRef, updates);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const deleteCategory = useCallback(async (
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteDoc(doc(getCategoriesRef(), categoryId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  return {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

// Hook para grupos de modificadores
export function useModifierGroups() {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);

  useEffect(() => {
    const q = query(
      getModifierGroupsRef(),
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
  }, []);

  const createGroup = useCallback(async (
    group: Omit<ModifierGroup, 'id' | 'tenantId'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await addDoc(getModifierGroupsRef(), {
        ...group,
        tenantId: TENANT_ID,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const updateGroup = useCallback(async (
    groupId: string,
    updates: Partial<ModifierGroup>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const groupRef = doc(getModifierGroupsRef(), groupId);
      await updateDoc(groupRef, updates);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const deleteGroup = useCallback(async (
    groupId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteDoc(doc(getModifierGroupsRef(), groupId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  return {
    groups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
