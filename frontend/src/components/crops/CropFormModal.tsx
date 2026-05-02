'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import api from '@/lib/axios';
import type { Crop } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const cropSchema = z.object({
  name:                z.string().min(1, 'Crop name is required'),
  variety:             z.string().optional(),
  category:            z.string().default('other'),
  season:              z.string().default('kharif'),
  fieldArea:           z.coerce.number().min(0).default(0),
  sowingDate:          z.string().optional(),
  expectedHarvestDate: z.string().optional(),
  currentGrowthStage:  z.string().default('seed'),
  waterRequirement:    z.string().default('medium'),
  notes:               z.string().optional(),
});

type CropForm = z.infer<typeof cropSchema>;

interface Props {
  crop: Crop | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CropFormModal({ crop, onClose, onSaved }: Props) {
  const isEdit = !!crop;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CropForm>({
    resolver: zodResolver(cropSchema),
  });

  useEffect(() => {
    if (crop) {
      reset({
        name:                crop.name,
        variety:             crop.variety,
        category:            crop.category,
        season:              crop.season,
        fieldArea:           crop.fieldArea,
        sowingDate:          crop.sowingDate ? crop.sowingDate.split('T')[0] : '',
        expectedHarvestDate: crop.expectedHarvestDate ? crop.expectedHarvestDate.split('T')[0] : '',
        currentGrowthStage:  crop.currentGrowthStage,
        waterRequirement:    crop.waterRequirement,
        notes:               crop.notes,
      });
    }
  }, [crop, reset]);

  const onSubmit = async (data: CropForm) => {
    try {
      if (isEdit) {
        await api.put(`/crops/${crop._id}`, data);
        toast.success('Crop updated successfully');
      } else {
        await api.post('/crops', data);
        toast.success('Crop added successfully 🌾');
      }
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save crop';
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Crop' : 'Add New Crop'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Crop Name *" placeholder="e.g. Wheat, Tomato, Rice" error={errors.name?.message} {...register('name')} />
            </div>
            <Input label="Variety" placeholder="e.g. HD-2967" {...register('variety')} />
            <div>
              <label className="label">Category</label>
              <select className="input" {...register('category')}>
                <option value="cereal">Cereal</option>
                <option value="vegetable">Vegetable</option>
                <option value="fruit">Fruit</option>
                <option value="pulse">Pulse</option>
                <option value="oilseed">Oilseed</option>
                <option value="spice">Spice</option>
                <option value="fiber">Fiber</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Season</label>
              <select className="input" {...register('season')}>
                <option value="kharif">Kharif (Jun–Nov)</option>
                <option value="rabi">Rabi (Nov–Apr)</option>
                <option value="zaid">Zaid (Mar–Jun)</option>
                <option value="year-round">Year-round</option>
              </select>
            </div>
            <Input label="Field Area (acres)" type="number" step="0.1" placeholder="0.0" {...register('fieldArea')} />
            <Input label="Sowing Date" type="date" {...register('sowingDate')} />
            <Input label="Expected Harvest" type="date" {...register('expectedHarvestDate')} />
            <div>
              <label className="label">Growth Stage</label>
              <select className="input" {...register('currentGrowthStage')}>
                {['seed','germination','seedling','vegetative','flowering','fruiting','maturity','harvest'].map(s => (
                  <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Water Requirement</label>
              <select className="input" {...register('waterRequirement')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={3} placeholder="Any additional notes..." {...register('notes')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {isEdit ? 'Update Crop' : 'Add Crop'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
