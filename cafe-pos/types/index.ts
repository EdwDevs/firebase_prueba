// ==================== ROLES Y USUARIOS ====================

export type UserRole = 'admin' | 'cashier' | 'waiter';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  tenantId: string;
}

// ==================== MESAS ====================

export interface Table {
  id: string;
  number: number;
  name: string;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId: string | null;
  position?: { x: number; y: number };
  tenantId: string;
}

// ==================== PRODUCTOS Y CATEGORÍAS ====================

export interface Category {
  id: string;
  name: string;
  order: number;
  color?: string;
  tenantId: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  selectionType: 'single' | 'multiple';
  isRequired: boolean;
  options: ModifierOption[];
  tenantId: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  sendsToBar: boolean;
  isActive: boolean;
  hasModifiers: boolean;
  modifierGroupIds: string[];
  inventoryItemId: string | null;
  createdAt: Date;
  tenantId: string;
}

// ==================== ÓRDENES ====================

export type OrderType = 'table' | 'takeout' | 'delivery';
export type OrderStatus = 'open' | 'paid' | 'cancelled' | 'delivered';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type PaymentMethod = 'cash' | 'nequi' | 'qr';

export interface OrderItemModifier {
  groupId: string;
  groupName: string;
  options: {
    id: string;
    name: string;
    priceDelta: number;
  }[];
}

export type BarStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  modifiers: OrderItemModifier[];
  subtotal: number;
  notes: string;
  sendsToBar: boolean;
  barStatus: BarStatus;
  sentToBarAt: Date | null;
  readyAt: Date | null;
}

export interface Order {
  id: string;
  type: OrderType;
  tableId: string | null;
  tableName: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  addressReference: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  itemsTotal: number;
  totalAmount: number;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  paidAt: Date | null;
  paidBy: string | null;
  cashSessionId: string | null;
  tenantId: string;
}

// ==================== BARRA ====================

export interface BarTicket {
  id: string;
  orderId: string;
  orderType: OrderType;
  tableName: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  productName: string;
  quantity: number;
  modifiers: string;
  notes: string;
  status: 'preparing' | 'ready';
  createdAt: Date;
  sentToBarAt: Date;
  readyAt: Date | null;
  tenantId: string;
}

// ==================== CAJA ====================

export interface CashSession {
  id: string;
  openedAt: Date;
  openedBy: string;
  openedByName: string;
  initialCash: number;
  closedAt: Date | null;
  closedBy: string | null;
  closedByName: string | null;
  finalCash: number | null;
  expectedCash: number | null;
  cashDifference: number | null;
  totalSales: number;
  totalByMethod: {
    cash: number;
    nequi: number;
    qr: number;
  };
  ordersCount: number;
  notes: string;
  isActive: boolean;
  tenantId: string;
}

// ==================== INVENTARIO ====================

export type InventoryUnit = 'unit' | 'ml' | 'gr' | 'oz';
export type MovementType = 'in' | 'out' | 'adjustment';

export interface InventoryItem {
  id: string;
  name: string;
  unit: InventoryUnit;
  currentStock: number;
  minStock: number;
  alertEnabled: boolean;
  lastMovementAt: Date;
  tenantId: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: MovementType;
  quantity: number;
  reason: string;
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  tenantId: string;
}

// ==================== CONFIGURACIÓN ====================

export interface TenantConfig {
  businessName: string;
  currency: string;
  timezone: string;
  features: {
    inventory: boolean;
    bar: boolean;
    delivery: boolean;
  };
}

// ==================== REPORTES ====================

export interface DailySalesReport {
  date: string;
  totalSales: number;
  totalByMethod: {
    cash: number;
    nequi: number;
    qr: number;
  };
  ordersCount: number;
  averageTicket: number;
}
