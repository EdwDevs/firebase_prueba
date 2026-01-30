'use client';

import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';

export default function AdminProductsPage() {
  const { products, categories, loading, updateProduct } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedByCategory = categories.map((cat) => ({
    ...cat,
    products: filteredProducts.filter((p) => p.categoryId === cat.id),
  }));

  const handleToggleActive = async (product: Product) => {
    await updateProduct(product.id, { isActive: !product.isActive });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button className="gap-2">
            <Plus size={18} />
            Nuevo
          </Button>
        </div>
      </div>

      {/* Productos por categoría */}
      {loading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : (
        groupedByCategory.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="text-lg">{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {category.products.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay productos en esta categoría
                </p>
              ) : (
                <div className="divide-y">
                  {category.products.map((product) => (
                    <div
                      key={product.id}
                      className="py-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{product.name}</p>
                          {product.sendsToBar && (
                            <Badge variant="secondary" className="text-xs">
                              Barra
                            </Badge>
                          )}
                          {product.hasModifiers && (
                            <Badge variant="outline" className="text-xs">
                              Modificadores
                            </Badge>
                          )}
                        </div>
                        <p className="text-lg font-bold text-primary">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title={product.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {product.isActive ? (
                            <ToggleRight size={24} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={24} className="text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingProduct(product)}
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
        ))
      )}
    </div>
  );
}
