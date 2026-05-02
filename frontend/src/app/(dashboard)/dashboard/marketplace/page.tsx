'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { Product } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, timeAgo, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
  Search, Plus, ShoppingBag, Star, MapPin, Filter,
  Eye, Tag, Package, ChevronLeft, ChevronRight
} from 'lucide-react';
import ProductFormModal from '@/components/marketplace/ProductFormModal';
import ProductDetailModal from '@/components/marketplace/ProductDetailModal';

const CATEGORIES = ['all', 'crop', 'fertilizer', 'pesticide', 'equipment', 'seed', 'tool', 'other'];

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings'>('browse');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '12', sort });
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);

      const endpoint = activeTab === 'my-listings' ? '/marketplace/user/my-listings' : '/marketplace';
      const { data } = await api.get(`${endpoint}?${params}`);
      setProducts(data.data);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [search, category, sort, page, activeTab]);

  const categoryEmoji: Record<string, string> = {
    crop: '🌾', fertilizer: '🧪', pesticide: '🐛', equipment: '🚜',
    seed: '🌱', tool: '🔧', other: '📦',
  };

  const categoryBadge: Record<string, 'green' | 'blue' | 'orange' | 'purple' | 'gray'> = {
    crop: 'green', fertilizer: 'blue', pesticide: 'orange',
    equipment: 'purple', seed: 'green', tool: 'gray', other: 'gray',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
          <p className="text-gray-500 mt-1">{total} listing{total !== 1 ? 's' : ''} available</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
          List Product
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {[{ id: 'browse', label: '🛒 Browse All' }, { id: 'my-listings', label: '📦 My Listings' }].map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id as 'browse' | 'my-listings'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9 py-2 text-sm" placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input py-2 text-sm w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Most Viewed</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              category === cat
                ? 'bg-green-600 text-white shadow-green-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            {cat !== 'all' && categoryEmoji[cat]} {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <PageLoader />
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'my-listings' ? "You haven't listed any products yet." : 'Try adjusting your filters.'}
          </p>
          {activeTab === 'my-listings' && (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>List Your First Product</Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="card-hover cursor-pointer overflow-hidden"
                onClick={() => setViewProduct(product)}
              >
                {/* Image */}
                <div className="relative h-44 bg-gray-100 dark:bg-gray-800">
                  {product.images?.[0]?.url ? (
                    <Image src={product.images[0].url} alt={product.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      {categoryEmoji[product.category] || '📦'}
                    </div>
                  )}
                  {product.organicCertified && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      🌿 Organic
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={categoryBadge[product.category] || 'gray'} className="capitalize">
                      {product.category}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">{product.title}</h3>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{truncate(product.description, 80)}</p>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-black text-green-600">{formatCurrency(product.price.amount)}</span>
                      <span className="text-xs text-gray-400 ml-1">/{product.price.unit}</span>
                    </div>
                    {product.price.negotiable && (
                      <span className="text-xs text-orange-600 font-medium">Negotiable</span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {product.location?.state || product.seller?.location?.state || 'India'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {product.views}
                    </span>
                    {product.ratings.count > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {product.ratings.average}
                      </span>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <Package className="w-3 h-3" />
                    {product.quantity.available} {product.quantity.unit} available
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Prev
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showForm && (
        <ProductFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchProducts(); }}
        />
      )}
      {viewProduct && (
        <ProductDetailModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
        />
      )}
    </div>
  );
}
