'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, TENANT_ID } from '@/lib/firebase';
import { InventoryItem, InventoryMovement, MovementType } from '@/types';
import { INVENTORY_UNITS, MOVEMENT_TYPES } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export default function AdminInventoryPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    unit: 'unit' as const,
    currentStock: 0,
    minStock: 0,
    alertEnabled: true,
  });
  
  const [movementForm, setMovementForm] = useState({
    type: 'in' as MovementType,
    quantity: 0,
    reason: '',
    notes: '',
  });

  useEffect(() => {
    // Escuchar items de inventario
    const itemsQuery = query(
      collection(db, 'tenants', TENANT_ID, 'inventoryItems'),
      orderBy('name')
    );
    
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      const itemsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        lastMovementAt: doc.data().lastMovementAt?.toDate(),
      })) as InventoryItem[];
      
      setItems(itemsData);
      setLoading(false);
    });

    // Escuchar movimientos
    const movementsQuery = query(
      collection(db, 'tenants', TENANT_ID, 'inventoryMovements'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribeMovements = onSnapshot(movementsQuery, (snapshot) => {
      const movementsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as InventoryMovement[];
      
      setMovements(movementsData.slice(0, 20)); // Solo últimos 20
    });

    return () => {
      unsubscribeItems();
      unsubscribeMovements();
    };
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, 'tenants', TENANT_ID, 'inventoryItems'), {
        ...itemForm,
        lastMovementAt: serverTimestamp(),
        tenantId: TENANT_ID,
      });
      
      setShowItemForm(false);
      setItemForm({ name: '', unit: 'unit', currentStock: 0, minStock: 0, alertEnabled: true });
    } catch (error) {
      console.error('Error creando item:', error);
      alert('Error al crear item');
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !user) return;
    
    try {
      // Crear movimiento
      await addDoc(collection(db, 'tenants', TENANT_ID, 'inventoryMovements'), {
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        type: movementForm.type,
        quantity: movementForm.quantity,
        reason: movementForm.reason,
        notes: movementForm.notes,
        createdBy: user.id,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
        tenantId: TENANT_ID,
      });
      
      // Actualizar stock del item
      const newStock = movementForm.type === 'in' 
        ? selectedItem.currentStock + movementForm.quantity
        : movementForm.type === 'out'
        ? selectedItem.currentStock - movementForm.quantity
        : movementForm.quantity; // adjustment
      
      await updateDoc(
        doc(db, 'tenants', TENANT_ID, 'inventoryItems', selectedItem.id),
        {
          currentStock: newStock,
          lastMovementAt: serverTimestamp(),
        }
      );
      
      setShowMovementForm(false);
      setMovementForm({ type: 'in', quantity: 0, reason: '', notes: '' });
      setSelectedItem(null);
    } catch (error) {
      console.error('Error creando movimiento:', error);
      alert('Error al registrar movimiento');
    }
  };

  const openMovementForm = (item: InventoryItem, type: MovementType) => {
    setSelectedItem(item);
    setMovementForm({ ...movementForm, type });
    setShowMovementForm(true);
  };

  const lowStockItems = items.filter(
    (item) => item.alertEnabled && item.currentStock <= item.minStock
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-gray-500">
            {items.length} items · {lowStockItems.length} con stock bajo
          </p>
        </div>
        <Button 
          className="gap-2"
          onClick={() => setShowItemForm(true)}
        >
          <Plus size={18} />
          Nuevo Item
        </Button>
      </div>

      {/* Alertas de stock bajo */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={20} />
              Alertas de Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <Badge key={item.id} variant="destructive">
                  {item.name}: {item.currentStock} {INVENTORY_UNITS[item.unit].abbreviation}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de nuevo item */}
      {showItemForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Item de Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Nombre"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad
                  </label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value as any })}
                    className="w-full h-10 rounded-lg border border-input px-3"
                  >
                    {Object.entries(INVENTORY_UNITS).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Stock inicial"
                  type="number"
                  value={itemForm.currentStock}
                  onChange={(e) => setItemForm({ ...itemForm, currentStock: parseInt(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Stock mínimo (alerta)"
                  type="number"
                  value={itemForm.minStock}
                  onChange={(e) => setItemForm({ ...itemForm, minStock: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowItemForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Item</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulario de movimiento */}
      {showMovementForm && selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle>
              {movementForm.type === 'in' && '⬆️ Entrada'}
              {movementForm.type === 'out' && '⬇️ Salida'}
              {movementForm.type === 'adjustment' && '⚖️ Ajuste'} - {selectedItem.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMovement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Cantidad"
                  type="number"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: parseInt(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Motivo"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                  placeholder="Ej: Compra, Merma, Ajuste..."
                  required
                />
                <Input
                  label="Notas (opcional)"
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowMovementForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Movimiento</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de items */}
      <Card>
        <CardHeader>
          <CardTitle>Items de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <div className="divide-y">
              {items.map((item) => {
                const isLowStock = item.alertEnabled && item.currentStock <= item.minStock;
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'py-4 flex items-center justify-between',
                      isLowStock && 'bg-red-50'
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        {isLowStock && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle size={12} className="mr-1" />
                            Stock bajo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Stock actual: <span className={cn(
                          'font-medium',
                          isLowStock ? 'text-red-600' : 'text-green-600'
                        )}>
                          {item.currentStock} {INVENTORY_UNITS[item.unit].abbreviation}
                        </span>
                        {' · '}
                        Mínimo: {item.minStock} {INVENTORY_UNITS[item.unit].abbreviation}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openMovementForm(item, 'in')}
                        className="p-2 hover:bg-green-100 text-green-600 rounded-lg"
                        title="Entrada"
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button
                        onClick={() => openMovementForm(item, 'out')}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                        title="Salida"
                      >
                        <ArrowDown size={18} />
                      </button>
                      <button
                        onClick={() => openMovementForm(item, 'adjustment')}
                        className="p-2 hover:bg-yellow-100 text-yellow-600 rounded-lg"
                        title="Ajuste"
                      >
                        <Minus size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {movements.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay movimientos registrados</p>
            ) : (
              movements.map((movement) => (
                <div key={movement.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={MOVEMENT_TYPES[movement.type].color}>
                        {MOVEMENT_TYPES[movement.type].label}
                      </Badge>
                      <span className="font-medium">{movement.itemName}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {movement.quantity} unidades · {movement.reason}
                      {movement.notes && ` · ${movement.notes}`}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">
                    {movement.createdByName}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
