'use client';

import { X, Edit2, Droplets, Calendar, Sprout, Leaf } from 'lucide-react';
import type { Crop } from '@/types';
import { HealthBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

interface Props {
  crop: Crop;
  onClose: () => void;
  onEdit: () => void;
}

export default function CropDetailModal({ crop, onClose, onEdit }: Props) {
  const soilFields = [
    { label: 'pH',         value: crop.soilInfo.ph,           unit: '' },
    { label: 'Nitrogen',   value: crop.soilInfo.nitrogen,     unit: 'kg/ha' },
    { label: 'Phosphorus', value: crop.soilInfo.phosphorus,   unit: 'kg/ha' },
    { label: 'Potassium',  value: crop.soilInfo.potassium,    unit: 'kg/ha' },
    { label: 'Moisture',   value: crop.soilInfo.moisture,     unit: '%' },
    { label: 'Organic',    value: crop.soilInfo.organicMatter,unit: '%' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl">🌾</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{crop.name}</h2>
              {crop.variety && <p className="text-sm text-gray-500">{crop.variety}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Edit2 className="w-3 h-3" />} onClick={onEdit}>Edit</Button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status row */}
          <div className="flex flex-wrap gap-3">
            <HealthBadge status={crop.healthStatus} />
            <span className="badge badge-blue capitalize">{crop.season}</span>
            <span className="badge badge-gray capitalize">{crop.currentGrowthStage}</span>
            <span className="badge badge-green">{crop.fieldArea} acres</span>
          </div>

          {/* Health score */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Health Score</span>
              <span className="font-bold text-gray-900 dark:text-white">{crop.healthScore}/100</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  crop.healthScore >= 80 ? 'bg-green-500' :
                  crop.healthScore >= 60 ? 'bg-yellow-400' : 'bg-red-500'
                }`}
                style={{ width: `${crop.healthScore}%` }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {crop.sowingDate && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Sowing Date</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatDate(crop.sowingDate)}</p>
                </div>
              </div>
            )}
            {crop.expectedHarvestDate && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Sprout className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Expected Harvest</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatDate(crop.expectedHarvestDate)}</p>
                </div>
              </div>
            )}
            {crop.daysToHarvest !== null && crop.daysToHarvest !== undefined && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Leaf className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Days to Harvest</p>
                  <p className="font-semibold text-green-700 dark:text-green-400 text-sm">{crop.daysToHarvest} days</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Water Requirement</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm capitalize">{crop.waterRequirement}</p>
              </div>
            </div>
          </div>

          {/* Soil Info */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Soil Information</h3>
            <div className="grid grid-cols-3 gap-3">
              {soilFields.map((f) => (
                <div key={f.label} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{f.label}</p>
                  <p className="font-bold text-gray-900 dark:text-white">{f.value}<span className="text-xs font-normal ml-0.5">{f.unit}</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          {crop.aiInsights?.recommendations?.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">🤖 AI Recommendations</h3>
              <ul className="space-y-2">
                {crop.aiInsights.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-green-500 mt-0.5">✓</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {crop.notes && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">{crop.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
