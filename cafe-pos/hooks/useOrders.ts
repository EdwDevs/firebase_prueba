'use client';

import { useCallback, useEffect, useState } from 'react';
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
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db, TENANT_ID } from '@/lib/firebase';
import { Order, OrderItem, PaymentMethod, OrderType } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { generateId } from '@/lib/utils';

const getOrdersRef = () => collection(db, 'tenants', TENANT_ID, 'orders');
const getOrderItemsRef = (orderId: string) => 
  collection(db, 'tenants', TENANT_ID, 'orders', orderId, 'orderItems');
const getBarTicketsRef = () => collection(db, 'tenants', TENANT_ID, 'barTickets');

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  // Escuchar órdenes abiertas en tiempo real
  useEffect(() => {
    const q = query(
      getOrdersRef(),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        paidAt: doc.data().paidAt?.toDate(),
      })) as Order[];
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error escuchando órdenes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Crear nueva orden
  const createOrder = useCallback(async (
    type: OrderType,
    items: Omit<OrderItem, 'id'>[],
    options: {
      tableId?: string | null;
      tableName?: string | null;
      customerName?: string;
      customerPhone?: string;
      customerAddress?: string;
      addressReference?: string;
    } = {}
  ): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    if (!user) return { success: false, error: 'No autenticado' };

    try {
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      
      const orderData = {
        type,
        tableId: options.tableId || null,
        tableName: options.tableName || null,
        customerName: options.customerName || null,
        customerPhone: options.customerPhone || null,
        customerAddress: options.customerAddress || null,
        addressReference: options.addressReference || null,
        status: 'open',
        paymentStatus: 'pending',
        paymentMethod: null,
        itemsTotal: items.length,
        totalAmount,
        discount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.id,
        paidAt: null,
        paidBy: null,
        cashSessionId: null,
        tenantId: TENANT_ID,
      };

      const orderRef = await addDoc(getOrdersRef(), orderData);
      
      // Crear items de la orden
      const batch = writeBatch(db);
      
      items.forEach((item) => {
        const itemRef = doc(getOrderItemsRef(orderRef.id));
        batch.set(itemRef, {
          ...item,
          tenantId: TENANT_ID,
        });
        
        // Crear ticket de barra si aplica
        if (item.sendsToBar) {
          const barTicketRef = doc(getBarTicketsRef());
          batch.set(barTicketRef, {
            id: itemRef.id,
            orderId: orderRef.id,
            orderType: type,
            tableName: options.tableName || null,
            customerName: options.customerName || null,
            customerPhone: options.customerPhone || null,
            customerAddress: options.customerAddress || null,
            productName: item.productName,
            quantity: item.quantity,
            modifiers: item.modifiers.map(m => 
              `${m.groupName}: ${m.options.map(o => o.name).join(', ')}`
            ).join('; '),
            notes: item.notes,
            status: 'preparing',
            createdAt: serverTimestamp(),
            sentToBarAt: serverTimestamp(),
            readyAt: null,
            tenantId: TENANT_ID,
          });
        }
      });
      
      await batch.commit();
      
      return { success: true, orderId: orderRef.id };
    } catch (error: any) {
      console.error('Error creando orden:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Actualizar orden
  const updateOrder = useCallback(async (
    orderId: string,
    updates: Partial<Order>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const orderRef = doc(getOrdersRef(), orderId);
      await updateDoc(orderRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error actualizando orden:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Cobrar orden
  const payOrder = useCallback(async (
    orderId: string,
    paymentMethod: PaymentMethod,
    cashSessionId: string | null
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No autenticado' };

    try {
      const orderRef = doc(getOrdersRef(), orderId);
      await updateDoc(orderRef, {
        status: 'paid',
        paymentStatus: 'paid',
        paymentMethod,
        paidAt: serverTimestamp(),
        paidBy: user.id,
        cashSessionId,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error cobrando orden:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Marcar domicilio como entregado
  const markDelivered = useCallback(async (
    orderId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const orderRef = doc(getOrdersRef(), orderId);
      await updateDoc(orderRef, {
        status: 'delivered',
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error marcando como entregado:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Cancelar orden
  const cancelOrder = useCallback(async (
    orderId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const orderRef = doc(getOrdersRef(), orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error cancelando orden:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Obtener items de una orden
  const getOrderItems = useCallback(async (orderId: string): Promise<OrderItem[]> => {
    try {
      const itemsSnapshot = await getDocs(getOrderItemsRef(orderId));
      return itemsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        sentToBarAt: doc.data().sentToBarAt?.toDate(),
        readyAt: doc.data().readyAt?.toDate(),
      })) as OrderItem[];
    } catch (error) {
      console.error('Error obteniendo items:', error);
      return [];
    }
  }, []);

  return {
    orders,
    loading,
    createOrder,
    updateOrder,
    payOrder,
    markDelivered,
    cancelOrder,
    getOrderItems,
  };
}

// Hook para obtener órdenes por fecha (reportes)
export function useOrdersByDate(startDate: Date, endDate: Date) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      getOrdersRef(),
      where('status', '==', 'paid'),
      where('paidAt', '>=', Timestamp.fromDate(startDate)),
      where('paidAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('paidAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        paidAt: doc.data().paidAt?.toDate(),
      })) as Order[];
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Error obteniendo órdenes por fecha:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [startDate, endDate]);

  return { orders, loading };
}
