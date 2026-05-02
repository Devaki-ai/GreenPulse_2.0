'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { Product } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate, formatCurrency, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, ShoppingBag } from 'lucide-react';
import Image from 'next/image';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/products/pending');
      setProducts(data.data);
    } catch {
      toast.error('Failed to load pending products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleModerate = async (id: string, action: 'approve' | 'reject', title: string) => {
    try {
      await api.patch(`/admin/products/${id}/moderate`, { action });
      toast.success(`Product "${title}" ${action}d`);
      fetchPending();
    } catch {
      toast.error('Failed to moderate product');
    }
  };

  const categoryEmoji: Record<string, string> = {
    crop: '🌾', fertilizer: '🧪', pesticide: '🐛',
    equipment: '🚜', seed: '🌱', tool: '🔧', other: '📦',
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Moderation</h1>
        <p className="text-gray-500 mt-1">{products.length} product{products.length !== 1 ? 's' : ''} pending review</p>
      </div>

      {loading ? <PageLoader /> : products.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">All caught up!</h3>
          <p className="text-gray-500">No products pending review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(product => (
            <Card key={product._id} hover>
              {/* Image */}
              <div className="relative h-40 bg-gray-100 dark:bg-gray-800 rounded-t-2xl overflow-hidden">
                {product.images?.[0]?.url ? (
                  <Image src={product.images[0].url} alt={product.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    {categoryEmoji[product.category] || '📦'}
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="yellow" dot>Pending Review</Badge>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{product.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{truncate(product.description, 80)}</p>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-black text-green-600">{formatCurrency(product.price.amount)}</span>
                  <Badge variant="gray" className="capitalize">{product.category}</Badge>
                </div>

                {/* Seller info */}
                <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                    {(product.seller as unknown as { name: string })?.name?.charAt(0) || 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{(product.seller as unknown as { name: string })?.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(product.createdAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="primary" size="sm" className="flex-1"
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => handleModerate(product._id, 'approve', product.title)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger" size="sm" className="flex-1"
                    leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => handleModerate(product._id, 'reject', product.title)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
