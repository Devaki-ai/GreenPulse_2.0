'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, MapPin, Star, Eye, Package, Phone, User, Tag } from 'lucide-react';
import type { Product } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatCurrency, timeAgo } from '@/lib/utils';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface Props { product: Product; onClose: () => void; }

export default function ProductDetailModal({ product, onClose }: Props) {
  const [activeImg, setActiveImg] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReview = async () => {
    try {
      setSubmitting(true);
      await api.post(`/marketplace/${product._id}/reviews`, { rating, comment });
      toast.success('Review submitted!');
      setComment('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit review';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryEmoji: Record<string, string> = {
    crop: '🌾', fertilizer: '🧪', pesticide: '🐛', equipment: '🚜',
    seed: '🌱', tool: '🔧', other: '📦',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{product.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <div>
            <div className="relative h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden mb-3">
              {product.images?.[activeImg]?.url ? (
                <Image src={product.images[activeImg].url} alt={product.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  {categoryEmoji[product.category] || '📦'}
                </div>
              )}
              {product.organicCertified && (
                <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  🌿 Organic
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-green-500' : 'border-transparent'}`}>
                    <Image src={img.url} alt="" width={56} height={56} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Price */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-green-600">{formatCurrency(product.price.amount)}</span>
                <span className="text-gray-400">/{product.price.unit}</span>
              </div>
              {product.price.negotiable && <p className="text-sm text-orange-600 font-medium">Price is negotiable</p>}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="green" className="capitalize">{product.category}</Badge>
              <Badge variant={product.status === 'active' ? 'green' : 'gray'} dot>{product.status}</Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-500 flex items-center gap-1"><Package className="w-3 h-3" /> Available</p>
                <p className="font-bold text-gray-900 dark:text-white">{product.quantity.available} {product.quantity.unit}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-500 flex items-center gap-1"><Eye className="w-3 h-3" /> Views</p>
                <p className="font-bold text-gray-900 dark:text-white">{product.views}</p>
              </div>
              {product.ratings.count > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Star className="w-3 h-3" /> Rating</p>
                  <p className="font-bold text-gray-900 dark:text-white">{product.ratings.average} ({product.ratings.count})</p>
                </div>
              )}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{product.location?.state || product.seller?.location?.state || 'India'}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Description</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{product.description}</p>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Seller */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Seller</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                  {product.seller?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{product.seller?.name}</p>
                  <p className="text-xs text-gray-500">{product.seller?.location?.district}, {product.seller?.location?.state}</p>
                </div>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Contact Seller
            </Button>
          </div>
        </div>

        {/* Add Review */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Leave a Review</h3>
          <div className="flex gap-2 mb-3">
            {[1,2,3,4,5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star className={`w-6 h-6 transition-colors ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <textarea
            className="input resize-none mb-3"
            rows={2}
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button size="sm" onClick={handleReview} isLoading={submitting}>Submit Review</Button>
        </div>
      </div>
    </div>
  );
}
