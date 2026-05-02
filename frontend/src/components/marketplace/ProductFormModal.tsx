'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import api from '@/lib/axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const productSchema = z.object({
  title:       z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category:    z.string().min(1, 'Category is required'),
  price:       z.coerce.number().min(0, 'Price must be positive'),
  priceUnit:   z.string().default('kg'),
  negotiable:  z.boolean().default(false),
  quantity:    z.coerce.number().min(0),
  quantityUnit:z.string().default('kg'),
  state:       z.string().optional(),
  district:    z.string().optional(),
  organic:     z.boolean().default(false),
  tags:        z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

interface Props { onClose: () => void; onSaved: () => void; }

export default function ProductFormModal({ onClose, onSaved }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { category: 'crop', priceUnit: 'kg', quantityUnit: 'kg' },
  });

  const onSubmit = async (data: ProductForm) => {
    try {
      await api.post('/marketplace', {
        title: data.title,
        description: data.description,
        category: data.category,
        price: { amount: data.price, unit: data.priceUnit, negotiable: data.negotiable },
        quantity: { available: data.quantity, unit: data.quantityUnit },
        location: { state: data.state || '', district: data.district || '' },
        organicCertified: data.organic,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
      });
      toast.success('Product listed successfully 🛒');
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to list product';
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">List a Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input label="Product Title *" placeholder="e.g. Fresh Organic Tomatoes" error={errors.title?.message} {...register('title')} />

          <div>
            <label className="label">Description *</label>
            <textarea className="input resize-none" rows={3} placeholder="Describe your product..." {...register('description')} />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div>
            <label className="label">Category *</label>
            <select className="input" {...register('category')}>
              {['crop','fertilizer','pesticide','equipment','seed','tool','other'].map(c => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase()+c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹) *" type="number" placeholder="0" error={errors.price?.message} {...register('price')} />
            <div>
              <label className="label">Price Unit</label>
              <select className="input" {...register('priceUnit')}>
                {['kg','quintal','tonne','piece','litre','bag','bundle'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity Available" type="number" placeholder="0" {...register('quantity')} />
            <div>
              <label className="label">Quantity Unit</label>
              <select className="input" {...register('quantityUnit')}>
                {['kg','quintal','tonne','piece','litre','bag','bundle'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="State" placeholder="e.g. Punjab" {...register('state')} />
            <Input label="District" placeholder="e.g. Ludhiana" {...register('district')} />
          </div>

          <Input label="Tags (comma separated)" placeholder="wheat, organic, fresh" {...register('tags')} />

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-green-600" {...register('negotiable')} />
              <span className="text-sm text-gray-700 dark:text-gray-300">Price Negotiable</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-green-600" {...register('organic')} />
              <span className="text-sm text-gray-700 dark:text-gray-300">Organic Certified</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>List Product</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
