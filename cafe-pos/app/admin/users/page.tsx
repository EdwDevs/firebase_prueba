'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { collection, query, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, TENANT_ID } from '@/lib/firebase';
import { User, UserRole } from '@/types';
import { ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'waiter' as UserRole,
    password: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'tenants', TENANT_ID, 'users'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as User[];
      
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Actualizar usuario existente
        await updateDoc(
          doc(db, 'tenants', TENANT_ID, 'users', editingUser.id),
          {
            displayName: formData.displayName,
            role: formData.role,
          }
        );
      } else {
        // Crear nuevo usuario
        await addDoc(collection(db, 'tenants', TENANT_ID, 'users'), {
          email: formData.email,
          displayName: formData.displayName,
          role: formData.role,
          isActive: true,
          createdAt: serverTimestamp(),
          tenantId: TENANT_ID,
        });
      }
      
      setShowForm(false);
      setEditingUser(null);
      setFormData({ email: '', displayName: '', role: 'waiter', password: '' });
    } catch (error) {
      console.error('Error guardando usuario:', error);
      alert('Error al guardar usuario');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await updateDoc(
        doc(db, 'tenants', TENANT_ID, 'users', user.id),
        { isActive: !user.isActive }
      );
    } catch (error) {
      console.error('Error actualizando usuario:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      password: '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button 
          className="gap-2"
          onClick={() => {
            setEditingUser(null);
            setFormData({ email: '', displayName: '', role: 'waiter', password: '' });
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          Nuevo Usuario
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
                {!editingUser && (
                  <Input
                    label="Correo electrónico"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full h-10 rounded-lg border border-input px-3"
                  >
                    <option value="waiter">Mesero</option>
                    <option value="cashier">Cajero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    'py-4 flex items-center justify-between',
                    !user.isActive && 'opacity-50'
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.displayName}</p>
                      <Badge className={ROLES[user.role].color}>
                        {ROLES[user.role].label}
                      </Badge>
                      {!user.isActive && (
                        <Badge variant="destructive">Inactivo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title={user.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {user.isActive ? (
                        <UserX size={18} className="text-red-500" />
                      ) : (
                        <UserCheck size={18} className="text-green-500" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
