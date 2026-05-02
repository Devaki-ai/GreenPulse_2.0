'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { SoilRecord } from '@/types';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Trash2, TrendingUp, FlaskConical } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import SoilFormModal from '@/components/soil/SoilFormModal';

const statusColor: Record<string, string> = {
  low: 'text-red-600 bg-red-50', medium: 'text-yellow-600 bg-yellow-50',
  high: 'text-green-600 bg-green-50', optimal: 'text-green-600 bg-green-50',
  dry: 'text-orange-600 bg-orange-50', wet: 'text-blue-600 bg-blue-50',
  neutral: 'text-green-600 bg-green-50', acidic: 'text-orange-600 bg-orange-50',
  alkaline: 'text-blue-600 bg-blue-50', very_acidic: 'text-red-600 bg-red-50',
  very_alkaline: 'text-purple-600 bg-purple-50',
};

export default function SoilPage() {
  const [records, setRecords] = useState<SoilRecord[]>([]);
  const [trend, setTrend] = useState<SoilRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<SoilRecord | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, trendRes] = await Promise.all([
        api.get('/soil?limit=20'),
        api.get('/soil/trend?limit=10'),
      ]);
      setRecords(recRes.data.data);
      setTrend(trendRes.data.data);
      if (recRes.data.data.length > 0) setSelected(recRes.data.data[0]);
    } catch {
      toast.error('Failed to load soil records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this soil record?')) return;
    try {
      await api.delete(`/soil/${id}`);
      toast.success('Record deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Build radar chart data from selected record
  const radarData = selected ? [
    { subject: 'Nitrogen',   value: Math.min(100, (selected.nutrients.nitrogen.value / 560) * 100) },
    { subject: 'Phosphorus', value: Math.min(100, (selected.nutrients.phosphorus.value / 25) * 100) },
    { subject: 'Potassium',  value: Math.min(100, (selected.nutrients.potassium.value / 280) * 100) },
    { subject: 'pH',         value: Math.min(100, (selected.ph.value / 14) * 100) },
    { subject: 'Moisture',   value: selected.moisture.value },
    { subject: 'Organic',    value: Math.min(100, (selected.organicMatter.value / 5) * 100) },
  ] : [];

  // Build trend chart data
  const trendChartData = trend.map((r) => ({
    date: formatDate(r.testDate, 'dd MMM'),
    pH: r.ph.value,
    Moisture: r.moisture.value,
    Nitrogen: r.nutrients.nitrogen.value,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Soil Tracker</h1>
          <p className="text-gray-500 mt-1">Monitor NPK levels, pH, and soil health over time</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
          Add Soil Test
        </Button>
      </div>

      {loading ? <PageLoader /> : records.length === 0 ? (
        <div className="text-center py-20">
          <FlaskConical className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No soil records yet</h3>
          <p className="text-gray-500 mb-6">Add your first soil test to start tracking soil health.</p>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>Add Soil Test</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Records list */}
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Test Records</h2>
              {records.map((rec) => (
                <div
                  key={rec._id}
                  onClick={() => setSelected(rec)}
                  className={`card p-4 cursor-pointer transition-all ${selected?._id === rec._id ? 'border-2 border-green-500' : 'hover:shadow-card-hover'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{rec.fieldName}</p>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(rec._id); }} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{formatDate(rec.testDate)} · {rec.soilType}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[rec.ph.status] || 'bg-gray-100 text-gray-600'}`}>
                      pH {rec.ph.value}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[rec.moisture.status] || 'bg-gray-100 text-gray-600'}`}>
                      {rec.moisture.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail + Radar */}
            {selected && (
              <div className="lg:col-span-2 space-y-6">
                {/* NPK Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Nitrogen (N)',   value: selected.nutrients.nitrogen.value,   status: selected.nutrients.nitrogen.status,   unit: 'kg/ha', color: 'green' },
                    { label: 'Phosphorus (P)', value: selected.nutrients.phosphorus.value, status: selected.nutrients.phosphorus.status, unit: 'kg/ha', color: 'blue' },
                    { label: 'Potassium (K)',  value: selected.nutrients.potassium.value,  status: selected.nutrients.potassium.status,  unit: 'kg/ha', color: 'orange' },
                  ].map((n) => (
                    <Card key={n.label} padding="sm">
                      <p className="text-xs text-gray-500 mb-1">{n.label}</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">{n.value}</p>
                      <p className="text-xs text-gray-400">{n.unit}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${statusColor[n.status] || 'bg-gray-100 text-gray-600'}`}>
                        {n.status}
                      </span>
                    </Card>
                  ))}
                </div>

                {/* More stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'pH Level',      value: selected.ph.value,            unit: '',  status: selected.ph.status },
                    { label: 'Moisture',      value: `${selected.moisture.value}`, unit: '%', status: selected.moisture.status },
                    { label: 'Organic Matter',value: `${selected.organicMatter.value}`, unit: '%', status: selected.organicMatter.status },
                  ].map((s) => (
                    <Card key={s.label} padding="sm">
                      <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}<span className="text-sm font-normal">{s.unit}</span></p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block capitalize ${statusColor[s.status] || 'bg-gray-100 text-gray-600'}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </Card>
                  ))}
                </div>

                {/* Radar Chart */}
                <Card>
                  <CardHeader><CardTitle>Soil Nutrient Profile</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Radar name="Soil" dataKey="value" stroke="#16a34a" fill="#16a34a" fillOpacity={0.25} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                {selected.aiRecommendations?.generalAdvice && (
                  <Card>
                    <CardHeader><CardTitle>🤖 AI Recommendations</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{selected.aiRecommendations.generalAdvice}</p>
                      {selected.aiRecommendations.fertilizers.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Recommended Fertilizers</p>
                          <div className="flex flex-wrap gap-2">
                            {selected.aiRecommendations.fertilizers.map((f, i) => (
                              <span key={i} className="badge badge-green">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selected.aiRecommendations.suitableCrops.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Suitable Crops</p>
                          <div className="flex flex-wrap gap-2">
                            {selected.aiRecommendations.suitableCrops.map((c, i) => (
                              <span key={i} className="badge badge-blue">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Trend Chart */}
          {trendChartData.length > 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <CardTitle>Soil Health Trend</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pH" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Moisture" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Nitrogen" stroke="#d4851e" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {showForm && (
        <SoilFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchData(); }}
        />
      )}
    </div>
  );
}
