'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { Crop } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { HealthBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, Search, Sprout, Trash2, Edit2, ChevronRight,
  Droplets, Calendar, BarChart2, Filter
} from 'lucide-react';
import CropFormModal from '@/components/crops/CropFormModal';
import CropDetailModal from '@/components/crops/CropDetailModal';

export default function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeason, setFilterSeason] = useState('');
  const [filterHealth, setFilterHealth] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCrop, setEditCrop] = useState<Crop | null>(null);
  const [viewCrop, setViewCrop] = useState<Crop | null>(null);
  const [total, setTotal] = useState(0);

  const fetchCrops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterSeason) params.set('season', filterSeason);
      if (filterHealth) params.set('healthStatus', filterHealth);
      const { data } = await api.get(`/crops?${params}`);
      setCrops(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load crops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCrops(); }, [search, filterSeason, filterHealth]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this crop? This cannot be undone.')) return;
    try {
      await api.delete(`/crops/${id}`);
      toast.success('Crop deleted');
      fetchCrops();
    } catch {
      toast.error('Failed to delete crop');
    }
  };

  const growthStageEmoji: Record<string, string> = {
    seed: '🌰', germination: '🌱', seedling: '🌿', vegetative: '🍃',
    flowering: '🌸', fruiting: '🍅', maturity: '🌾', harvest: '✂️',
  };

  const healthColors: Record<string, string> = {
    excellent: 'border-l-green-500', good: 'border-l-green-400',
    fair: 'border-l-yellow-400', poor: 'border-l-orange-500', critical: 'border-l-red-500',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Crops</h1>
          <p className="text-gray-500 mt-1">{total} crop{total !== 1 ? 's' : ''} on your farm</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditCrop(null); setShowForm(true); }}>
          Add Crop
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9 py-2 text-sm"
              placeholder="Search crops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input py-2 text-sm w-auto" value={filterSeason} onChange={(e) => setFilterSeason(e.target.value)}>
            <option value="">All Seasons</option>
            <option value="kharif">Kharif</option>
            <option value="rabi">Rabi</option>
            <option value="zaid">Zaid</option>
            <option value="year-round">Year-round</option>
          </select>
          <select className="input py-2 text-sm w-auto" value={filterHealth} onChange={(e) => setFilterHealth(e.target.value)}>
            <option value="">All Health</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="critical">Critical</option>
          </select>
          {(search || filterSeason || filterHealth) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterSeason(''); setFilterHealth(''); }}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Crops Grid */}
      {loading ? (
        <PageLoader />
      ) : crops.length === 0 ? (
        <div className="text-center py-20">
          <Sprout className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No crops found</h3>
          <p className="text-gray-500 mb-6">Add your first crop to start tracking its health and growth.</p>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
            Add Your First Crop
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {crops.map((crop) => (
            <div
              key={crop._id}
              className={`card border-l-4 ${healthColors[crop.healthStatus] || 'border-l-gray-300'} hover:shadow-card-hover transition-all duration-200 cursor-pointer`}
              onClick={() => setViewCrop(crop)}
            >
              <div className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-2xl">
                      {growthStageEmoji[crop.currentGrowthStage] || '🌾'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{crop.name}</h3>
                      {crop.variety && <p className="text-xs text-gray-500">{crop.variety}</p>}
                    </div>
                  </div>
                  <HealthBadge status={crop.healthStatus} />
                </div>

                {/* Health score bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Health Score</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{crop.healthScore}/100</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        crop.healthScore >= 80 ? 'bg-green-500' :
                        crop.healthScore >= 60 ? 'bg-yellow-400' :
                        crop.healthScore >= 40 ? 'bg-orange-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${crop.healthScore}%` }}
                    />
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Season</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{crop.season}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Stage</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{crop.currentGrowthStage}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Area</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{crop.fieldArea} ac</p>
                  </div>
                </div>

                {/* Dates */}
                {(crop.sowingDate || crop.daysToHarvest !== null) && (
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    {crop.sowingDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Sown {formatDate(crop.sowingDate, 'dd MMM')}
                      </span>
                    )}
                    {crop.daysToHarvest !== null && crop.daysToHarvest !== undefined && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Sprout className="w-3 h-3" /> {crop.daysToHarvest}d to harvest
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="secondary" size="sm" className="flex-1"
                    leftIcon={<Edit2 className="w-3 h-3" />}
                    onClick={() => { setEditCrop(crop); setShowForm(true); }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(crop._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setViewCrop(crop)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <CropFormModal
          crop={editCrop}
          onClose={() => { setShowForm(false); setEditCrop(null); }}
          onSaved={() => { setShowForm(false); setEditCrop(null); fetchCrops(); }}
        />
      )}
      {viewCrop && (
        <CropDetailModal
          crop={viewCrop}
          onClose={() => setViewCrop(null)}
          onEdit={() => { setEditCrop(viewCrop); setViewCrop(null); setShowForm(true); }}
        />
      )}
    </div>
  );
}
