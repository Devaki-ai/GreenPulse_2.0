'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import api from '@/lib/axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const soilSchema = z.object({
  fieldName:    z.string().min(1, 'Field name is required'),
  soilType:     z.string().default('unknown'),
  testMethod:   z.string().default('manual'),
  nitrogen:     z.coerce.number().min(0).default(0),
  phosphorus:   z.coerce.number().min(0).default(0),
  potassium:    z.coerce.number().min(0).default(0),
  ph:           z.coerce.number().min(0).max(14).default(7),
  moisture:     z.coerce.number().min(0).max(100).default(0),
  organicMatter:z.coerce.number().min(0).default(0),
  notes:        z.string().optional(),
});

type SoilForm = z.infer<typeof soilSchema>;

interface Props { onClose: () => void; onSaved: () => void; }

export default function SoilFormModal({ onClose, onSaved }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SoilForm>({
    resolver: zodResolver(soilSchema),
    defaultValues: { fieldName: 'Main Field', soilType: 'loamy', testMethod: 'manual', ph: 7 },
  });

  const onSubmit = async (data: SoilForm) => {
    try {
      await api.post('/soil', {
        fieldName: data.fieldName,
        soilType: data.soilType,
        testMethod: data.testMethod,
        nutrients: { nitrogen: data.nitrogen, phosphorus: data.phosphorus, potassium: data.potassium },
        ph: data.ph,
        moisture: data.moisture,
        organicMatter: data.organicMatter,
        notes: data.notes,
      });
      toast.success('Soil record added 🧪');
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save';
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Soil Test</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Field Name *" placeholder="e.g. North Field" error={errors.fieldName?.message} {...register('fieldName')} />
            </div>
            <div>
              <label className="label">Soil Type</label>
              <select className="input" {...register('soilType')}>
                {['clay','sandy','loamy','silty','peaty','chalky','unknown'].map(t => (
                  <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Test Method</label>
              <select className="input" {...register('testMethod')}>
                <option value="manual">Manual</option>
                <option value="lab">Lab Test</option>
                <option value="sensor">Sensor</option>
                <option value="ai_estimated">AI Estimated</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">NPK Values (kg/ha)</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Nitrogen (N)" type="number" placeholder="0" {...register('nitrogen')} />
              <Input label="Phosphorus (P)" type="number" placeholder="0" {...register('phosphorus')} />
              <Input label="Potassium (K)" type="number" placeholder="0" {...register('potassium')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="pH (0-14)" type="number" step="0.1" placeholder="7.0" {...register('ph')} />
            <Input label="Moisture (%)" type="number" placeholder="0" {...register('moisture')} />
            <Input label="Organic (%)" type="number" step="0.1" placeholder="0" {...register('organicMatter')} />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} placeholder="Any observations..." {...register('notes')} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>Save Record</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
