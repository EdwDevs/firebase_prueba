import { create } from 'zustand';
import { Order, OrderItem, Product, Table, PaymentMethod, OrderType } from '@/types';

interface CartItem {
  product: Product;
  quantity: number;
  modifiers: {
    groupId: string;
    groupName: string;
    options: { id: string; name: string; priceDelta: number }[];
  }[];
  notes: string;
}

interface PosState {
  // Mesas
  selectedTable: Table | null;
  setSelectedTable: (table: Table | null) => void;
  
  // Carrito actual
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  
  // Orden actual
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  
  // Tipo de orden
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  
  // Cliente (para llevar/domicilio)
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    addressReference: string;
  };
  setCustomerInfo: (info: Partial<PosState['customerInfo']>) => void;
  resetCustomerInfo: () => void;
  
  // Cálculos
  getSubtotal: () => number;
  getTotal: () => number;
  getItemsCount: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  // Mesas
  selectedTable: null,
  setSelectedTable: (table) => set({ selectedTable: table }),
  
  // Carrito
  cart: [],
  addToCart: (item) => set((state) => ({ 
    cart: [...state.cart, item] 
  })),
  removeFromCart: (index) => set((state) => ({
    cart: state.cart.filter((_, i) => i !== index)
  })),
  updateQuantity: (index, quantity) => set((state) => {
    if (quantity <= 0) {
      return { cart: state.cart.filter((_, i) => i !== index) };
    }
    const newCart = [...state.cart];
    newCart[index].quantity = quantity;
    return { cart: newCart };
  }),
  clearCart: () => set({ cart: [] }),
  
  // Orden actual
  currentOrder: null,
  setCurrentOrder: (order) => set({ currentOrder: order }),
  
  // Tipo de orden
  orderType: 'table',
  setOrderType: (type) => set({ orderType: type }),
  
  // Cliente
  customerInfo: {
    name: '',
    phone: '',
    address: '',
    addressReference: '',
  },
  setCustomerInfo: (info) => set((state) => ({
    customerInfo: { ...state.customerInfo, ...info }
  })),
  resetCustomerInfo: () => set({
    customerInfo: {
      name: '',
      phone: '',
      address: '',
      addressReference: '',
    }
  }),
  
  // Cálculos
  getSubtotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => {
      const modifiersTotal = item.modifiers.reduce((sum, m) => 
        sum + m.options.reduce((oSum, o) => oSum + o.priceDelta, 0), 0
      );
      return total + (item.product.price + modifiersTotal) * item.quantity;
    }, 0);
  },
  
  getTotal: () => {
    return get().getSubtotal();
  },
  
  getItemsCount: () => {
    return get().cart.reduce((count, item) => count + item.quantity, 0);
  },
}));
