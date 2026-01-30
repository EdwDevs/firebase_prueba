'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { usePosStore } from '@/store/posStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatPrice, isValidPhone } from '@/lib/utils';
import { Product } from '@/types';

// Componente de modificadores (similar al de mesas)
function ModifierModal({
  product,
  isOpen,
  onClose,
  onConfirm,
  modifierGroups,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (modifiers: any[], notes: string) => void;
  modifierGroups: any[];
}) {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState('');

  if (!isOpen || !product) return null;

  const handleOptionToggle = (groupId: string, optionId: string, selectionType: string) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      if (selectionType === 'single') {
        return { ...prev, [groupId]: [optionId] };
      }
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
      options: group.options.filter((o: any) => 
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">×</button>
        </div>
        <div className="p-4 space-y-4">
          {modifierGroups.map((group) => (
            <div key={group.id}>
              <h4 className="font-medium mb-2">{group.name}</h4>
              <div className="space-y-2">
                {group.options.map((option: any) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionToggle(group.id, option.id, group.selectionType)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg border',
                      (selectedModifiers[group.id] || []).includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200'
                    )}
                  >
                    <span>{option.name}</span>
                    {option.priceDelta > 0 && <span>+{formatPrice(option.priceDelta)}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <h4 className="font-medium mb-2">Notas</h4>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleConfirm} className="flex-1">Agregar</Button>
        </div>
      </div>
    </div>
  );
}

export default function TakeoutPage() {
  const router = useRouter();
  const { products, categories, getProductsByCategory, getProductModifiers, modifierGroups } = useProducts();
  const { createOrder } = useOrders();
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    getTotal,
    getItemsCount,
    customerInfo,
    setCustomerInfo,
    resetCustomerInfo,
  } = usePosStore();
  const { modals, openModal, closeModal } = useUIStore();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredProducts = selectedCategory 
    ? getProductsByCategory(selectedCategory)
    : products;

  const handleAddProduct = (product: Product) => {
    const modifiers = modifierGroups.filter((g) => product.modifierGroupIds?.includes(g.id));
    if (modifiers.length > 0) {
      setSelectedProduct(product);
      openModal('modifiers');
    } else {
      addToCart({ product, quantity: 1, modifiers: [], notes: '' });
    }
  };

  const handleConfirmModifiers = (modifiers: any[], notes: string) => {
    if (selectedProduct) {
      addToCart({ product: selectedProduct, quantity: 1, modifiers, notes });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!customerInfo.name.trim() || customerInfo.name.length < 2) {
      newErrors.name = 'Nombre requerido (mínimo 2 caracteres)';
    }
    if (!isValidPhone(customerInfo.phone)) {
      newErrors.phone = 'Teléfono inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOrder = async () => {
    if (!validate() || cart.length === 0) return;
    
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

    const result = await createOrder('takeout', orderItems, {
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
    });

    if (result.success) {
      clearCart();
      resetCustomerInfo();
      router.push('/pos/tables');
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
      {/* Panel izquierdo */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pos/tables">
            <Button variant="outline" size="icon"><ArrowLeft size={20} /></Button>
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-orange-500" />
            <h1 className="text-xl font-bold">Para Llevar</h1>
          </div>
        </div>

        {/* Datos del cliente */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <Input
              label="Nombre del cliente"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ name: e.target.value })}
              placeholder="Ej: Juan Pérez"
              error={errors.name}
              required
            />
            <Input
              label="Teléfono"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ phone: e.target.value })}
              placeholder="Ej: 3123456789"
              error={errors.phone}
              required
            />
          </CardContent>
        </Card>

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-4 py-2 rounded-lg whitespace-nowrap',
              selectedCategory === null ? 'bg-primary text-white' : 'bg-gray-100'
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-lg whitespace-nowrap',
                selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-gray-100'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Productos */}
        <div className="product-grid overflow-y-auto flex-1">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleAddProduct(product)}
              className="bg-white border rounded-xl p-4 text-left hover:shadow-md"
            >
              <h3 className="font-medium text-sm">{product.name}</h3>
              <p className="text-lg font-bold mt-1">{formatPrice(product.price)}</p>
              {product.sendsToBar && <Badge variant="secondary" className="mt-2">Barra</Badge>}
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
              {cart.length > 0 && <Badge>{getItemsCount()} items</Badge>}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Agrega productos</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm">{formatPrice(
                          (item.product.price + item.modifiers.reduce((sum, m) => 
                            sum + m.options.reduce((oSum, o) => oSum + o.priceDelta, 0), 0
                          )) * item.quantity
                        )}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(index, item.quantity - 1)} className="p-1">-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(index, item.quantity + 1)} className="p-1">+</button>
                        <button onClick={() => removeFromCart(index)} className="p-1 text-red-500">×</button>
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
                <Button variant="outline" onClick={clearCart}>Limpiar</Button>
                <Button onClick={handleSendOrder} isLoading={isProcessing} className="gap-2">
                  <Send size={18} /> Enviar
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <ModifierModal
        product={selectedProduct}
        isOpen={modals.modifiers}
        onClose={() => closeModal('modifiers')}
        onConfirm={handleConfirmModifiers}
        modifierGroups={selectedProduct ? modifierGroups.filter((g) => 
          selectedProduct.modifierGroupIds?.includes(g.id)
        ) : []}
      />
    </div>
  );
}
