import { UserRole, PaymentMethod, OrderType } from '@/types';

export const ROLES: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
  cashier: { label: 'Cajero', color: 'bg-blue-100 text-blue-800' },
  waiter: { label: 'Mesero', color: 'bg-green-100 text-green-800' },
};

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; color: string; icon: string }> = {
  cash: { label: 'Efectivo', color: 'bg-green-100 text-green-800', icon: 'Banknote' },
  nequi: { label: 'Nequi', color: 'bg-blue-100 text-blue-800', icon: 'Smartphone' },
  qr: { label: 'QR', color: 'bg-purple-100 text-purple-800', icon: 'QrCode' },
};

export const ORDER_TYPES: Record<OrderType, { label: string; color: string; icon: string }> = {
  table: { label: 'Mesa', color: 'bg-amber-100 text-amber-800', icon: 'Armchair' },
  takeout: { label: 'Para Llevar', color: 'bg-orange-100 text-orange-800', icon: 'ShoppingBag' },
  delivery: { label: 'Domicilio', color: 'bg-pink-100 text-pink-800', icon: 'Truck' },
};

export const ORDER_STATUS = {
  open: { label: 'Abierta', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Pagada', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  delivered: { label: 'Entregada', color: 'bg-blue-100 text-blue-800' },
};

export const BAR_STATUS = {
  pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-800' },
  preparing: { label: 'Preparando', color: 'bg-yellow-100 text-yellow-800' },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-800' },
  delivered: { label: 'Entregado', color: 'bg-blue-100 text-blue-800' },
};

export const TABLE_STATUS = {
  available: { label: 'Libre', color: 'bg-green-100 text-green-800 border-green-300' },
  occupied: { label: 'Ocupada', color: 'bg-red-100 text-red-800 border-red-300' },
  reserved: { label: 'Reservada', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
};

// Configuración del negocio
export const BUSINESS_CONFIG = {
  name: 'ProCafees POS',
  currency: 'COP',
  timezone: 'America/Bogota',
  tablesCount: 14,
};

// Unidades de inventario
export const INVENTORY_UNITS = {
  unit: { label: 'Unidad', abbreviation: 'und' },
  ml: { label: 'Mililitros', abbreviation: 'ml' },
  gr: { label: 'Gramos', abbreviation: 'gr' },
  oz: { label: 'Onzas', abbreviation: 'oz' },
};

// Tipos de movimiento de inventario
export const MOVEMENT_TYPES = {
  in: { label: 'Entrada', color: 'bg-green-100 text-green-800' },
  out: { label: 'Salida', color: 'bg-red-100 text-red-800' },
  adjustment: { label: 'Ajuste', color: 'bg-yellow-100 text-yellow-800' },
};
