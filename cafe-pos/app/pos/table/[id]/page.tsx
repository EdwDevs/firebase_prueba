'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Send,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useTables } from '@/hooks/useTables';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { usePosStore } from '@/store/posStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatPrice } from '@/lib/utils';
import { Product, ModifierGroup } from '@/types';
import { ORDER_TYPES, BAR_STATUS } from '@/lib/constants';

// Modal de modificadores
function ModifierModal({
  product,
  isOpen,
  onClose,
  onConfirm,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (modifiers: any[], notes: string) => void;
}) {
  const { getProductModifiers } = useProducts();
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedModifiers({});
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const modifierGroups = getProductModifiers(product);

  const handleOptionToggle = (groupId: string, optionId: string, selectionType: string) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      
      if (selectionType === 'single') {
        return { ...prev, [groupId]: [optionId] };
      }
      
      // Multiple selection
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const handleConfirm = () => {
    const modifiers = modifierGroups.map((group) => ({
      groupId: group.id,
      groupName: group.name,
      options: group.options.filter((o) => 
        (selectedModifiers[group.id] || []).includes(o.id)
      ),
    }));
    onConfirm(modifiers, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {modifierGroups.map((group) => (
            <div key={group.id}>
              <h4 className="font-medium mb-2">
                {group.name}
                {group.isRequired && <span className="text-red-500 ml-1">*</span>}
              </h4>
              <div className="space-y-2">
                {group.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionToggle(group.id, option.id, group.selectionType)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
                      (selectedModifiers[group.id] || []).includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <span>{option.name}</span>
                    {option.priceDelta > 0 && (
                      <span className="text-sm text-gray-500">
                        +{formatPrice(option.priceDelta)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          <div>
            <h4 className="font-medium mb-2">Notas</h4>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Sin hielo, muy caliente..."
            />
          </div>
        </div>
        
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}

// Modal de pago
function PaymentModal({
  isOpen,
  total,
  onClose,
  onPay,
}: {
  isOpen: boolean;
  total: number;
  onClose: () => void;
  onPay: (method: 'cash' | 'nequi' | 'qr') => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'nequi' | 'qr'>('cash');
  const [cashReceived, setCashReceived] = useState('');

  if (!isOpen) return null;

  const change = selectedMethod === 'cash' 
    ? (parseInt(cashReceived) || 0) - total 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cobrar</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="text-center">
            <p className="text-gray-500">Total a pagar</p>
            <p className="text-3xl font-bold">{formatPrice(total)}</p>
          </div>
          
          <div className="space-y-2">
            <p className="font-medium">Método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'nequi', 'qr'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  className={cn(
                    'p-3 rounded-lg border text-center transition-colors',
                    selectedMethod === method
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <p className="font-medium capitalize">
                    {method === 'cash' ? 'Efectivo' : method === 'nequi' ? 'Nequi' : 'QR'}
                  </p>
                </button>
              ))}
            </div>
          </div>
          
          {selectedMethod === 'cash' && (
            <div>
              <label className="font-medium">Efectivo recibido</label>
              <Input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0"
                className="text-lg"
              />
              {change >= 0 && (
                <p className="mt-2 text-lg">
                  Cambio: <span className="font-bold text-green-600">{formatPrice(change)}</span>
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={() => onPay(selectedMethod)} 
            className="flex-1"
            disabled={selectedMethod === 'cash' && change < 0}
          >
            Confirmar Pago
          </Button>
        </div>
      </div>
    </div>
  );
}

// Página principal
export default function TableOrderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = params.id as string;
  const isNew = searchParams.get('new') === 'true';
  
  const { tables, updateTableStatus } = useTables();
  const { products, categories, getProductsByCategory, getProductModifiers } = useProducts();
  const { createOrder, payOrder } = useOrders();
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    getSubtotal,
    getTotal,
    getItemsCount,
  } = usePosStore();
  const { modals, openModal, closeModal } = useUIStore();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const table = tables.find((t) => t.id === tableId);
  const filteredProducts = selectedCategory 
    ? getProductsByCategory(selectedCategory)
    : products;

  // Si es nueva mesa y está ocupada, redirigir
  useEffect(() => {
    if (isNew && table?.status === 'occupied') {
      router.replace(`/pos/table/${tableId}`);
    }
  }, [isNew, table, tableId, router]);

  const handleAddProduct = (product: Product) => {
    const modifiers = getProductModifiers(product);
    
    if (modifiers.length > 0) {
      setSelectedProduct(product);
      openModal('modifiers');
    } else {
      addToCart({
        product,
        quantity: 1,
        modifiers: [],
        notes: '',
      });
    }
  };

  const handleConfirmModifiers = (modifiers: any[], notes: string) => {
    if (selectedProduct) {
      addToCart({
        product: selectedProduct,
        quantity: 1,
        modifiers,
        notes,
      });
    }
  };

  const handleSendOrder = async () => {
    if (!table || cart.length === 0) return;
    
    setIsProcessing(true);
    
    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      unitPrice: item.product.price,
      quantity: item.quantity,
      modifiers: item.modifiers,
      subtotal: (item.product.price + item.modifiers.reduce((sum, m) => 
        sum + m.options.reduce((oSum, o) => oSum + o.priceDelta, 0), 0
      )) * item.quantity,
      notes: item.notes,
      sendsToBar: item.product.sendsToBar,
      barStatus: item.product.sendsToBar ? 'preparing' : 'delivered',
      sentToBarAt: item.product.sendsToBar ? new Date() : null,
      readyAt: null,
    }));

    const result = await createOrder('table', orderItems, {
      tableId: table.id,
      tableName: table.name,
    });

    if (result.success) {
      await updateTableStatus(table.id, 'occupied', result.orderId!);
      clearCart();
      router.push('/pos/tables');
    }
    
    setIsProcessing(false);
  };

  const handlePay = async (method: 'cash' | 'nequi' | 'qr') => {
    // Aquí iría la lógica de pago para órdenes existentes
    closeModal('payment');
  };

  if (!table) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Mesa no encontrada</p>
        <Link href="/pos/tables">
          <Button variant="outline" className="mt-4">
            Volver a mesas
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
      {/* Panel izquierdo - Productos */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pos/tables">
            <Button variant="outline" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{table.name}</h1>
            <p className="text-sm text-gray-500">
              {table.status === 'occupied' ? 'Orden activa' : 'Nueva orden'}
            </p>
          </div>
        </div>

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-4 py-2 rounded-lg whitespace-nowrap transition-colors',
              selectedCategory === null
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-lg whitespace-nowrap transition-colors',
                selectedCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        <div className="product-grid overflow-y-auto flex-1">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleAddProduct(product)}
              className="bg-white border rounded-xl p-4 text-left hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-sm">{product.name}</h3>
              <p className="text-lg font-bold mt-1">{formatPrice(product.price)}</p>
              {product.sendsToBar && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  Barra
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Panel derecho - Carrito */}
      <div className="w-full lg:w-96 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Orden</span>
              {cart.length > 0 && (
                <Badge>{getItemsCount()} items</Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Agrega productos a la orden
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        {item.modifiers.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {item.modifiers.map(m => 
                              `${m.groupName}: ${m.options.map(o => o.name).join(', ')}`
                            ).join('; ')}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-gray-400 italic">
                            Nota: {item.notes}
                          </p>
                        )}
                        <p className="text-sm font-medium mt-1">
                          {formatPrice(
                            (item.product.price + item.modifiers.reduce((sum, m) => 
                              sum + m.options.reduce((oSum, o) => oSum + o.priceDelta, 0), 0
                            )) * item.quantity
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1 hover:bg-red-100 text-red-500 rounded ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          
          {cart.length > 0 && (
            <div className="p-4 border-t space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(getTotal())}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="w-full"
                >
                  Limpiar
                </Button>
                <Button
                  onClick={handleSendOrder}
                  isLoading={isProcessing}
                  className="w-full gap-2"
                >
                  <Send size={18} />
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modales */}
      <ModifierModal
        product={selectedProduct}
        isOpen={modals.modifiers}
        onClose={() => closeModal('modifiers')}
        onConfirm={handleConfirmModifiers}
      />
      
      <PaymentModal
        isOpen={modals.payment}
        total={getTotal()}
        onClose={() => closeModal('payment')}
        onPay={handlePay}
      />
    </div>
  );
}
