'use client';

import { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { collection, query, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db, TENANT_ID } from '@/lib/firebase';
import { Table } from '@/types';

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'tenants', TENANT_ID, 'tables'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tablesData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Table[];
      
      setTables(tablesData.sort((a, b) => a.number - b.number));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateName = (id: string, name: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name } : t))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      tables.forEach((table) => {
        const tableRef = doc(db, 'tenants', TENANT_ID, 'tables', table.id);
        batch.update(tableRef, { name: table.name });
      });
      
      await batch.commit();
      alert('Mesas actualizadas correctamente');
    } catch (error) {
      console.error('Error guardando mesas:', error);
      alert('Error al guardar');
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (!confirm('¿Estás seguro de resetear las mesas a los nombres por defecto?')) return;
    
    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      tables.forEach((table) => {
        const tableRef = doc(db, 'tenants', TENANT_ID, 'tables', table.id);
        batch.update(tableRef, { name: `Mesa ${table.number}` });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error reseteando mesas:', error);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Mesas</h1>
          <p className="text-gray-500">Personaliza los nombres de las 14 mesas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw size={18} />
            Resetear
          </Button>
          <Button onClick={handleSave} isLoading={saving} className="gap-2">
            <Save size={18} />
            Guardar
          </Button>
        </div>
      </div>

      {/* Grid de mesas */}
      <Card>
        <CardHeader>
          <CardTitle>Mesas</CardTitle>
          <CardDescription>
            Edita el nombre de cada mesa según prefieras (ej: "Mesa 1", "Terraza 1", "VIP 1", etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map((table) => (
                <div key={table.id} className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Mesa {table.number}
                  </label>
                  <Input
                    value={table.name}
                    onChange={(e) => handleUpdateName(table.id, e.target.value)}
                    placeholder={`Mesa ${table.number}`}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
