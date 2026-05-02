'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import StatCard from '@/components/ui/StatCard';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { HealthBadge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate, timeAgo, getWeatherEmoji } from '@/lib/utils';
import type { DashboardStats } from '@/types';
import { Sprout, ScanLine, Droplets, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/users/dashboard');
        setStats(data.data);
      } catch {
        // Use empty stats on error
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <PageLoader />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening on your farm today</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{formatDate(new Date(), 'EEEE, dd MMM yyyy')}</p>
          <p className="text-xs text-green-600 font-medium mt-0.5">🌱 Farm Status: Active</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Crops"
          value={stats?.overview.totalCrops ?? 0}
          icon={<Sprout />}
          color="green"
          change={`${stats?.overview.activeCrops ?? 0} active`}
          changeType="neutral"
        />
        <StatCard
          title="Crop Health"
          value={`${stats?.overview.healthPercentage ?? 0}%`}
          icon={<CheckCircle />}
          color="blue"
          change={`${stats?.overview.healthyCrops ?? 0} healthy crops`}
          changeType="up"
        />
        <StatCard
          title="AI Scans"
          value={stats?.overview.totalScans ?? 0}
          icon={<ScanLine />}
          color="purple"
          change="Disease detections"
          changeType="neutral"
        />
        <StatCard
          title="Soil Records"
          value={stats?.latestSoilRecord ? 'Updated' : 'No data'}
          icon={<Droplets />}
          color="orange"
          change={stats?.latestSoilRecord ? timeAgo(stats.latestSoilRecord.testDate) : 'Add soil data'}
          changeType="neutral"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Crops */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Crops</CardTitle>
                <Link href="/dashboard/crops" className="text-sm text-green-600 hover:text-green-700 font-medium">
                  View all →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recentCrops && stats.recentCrops.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentCrops.map((crop) => (
                    <div key={crop._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-xl">
                          🌾
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{crop.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{crop.currentGrowthStage} stage</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <HealthBadge status={crop.healthStatus} />
                        <p className="text-xs text-gray-400 mt-1">Score: {crop.healthScore}/100</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No crops added yet</p>
                  <Link href="/dashboard/crops" className="text-green-600 text-sm font-medium hover:underline mt-1 inline-block">
                    Add your first crop →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Health Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Crop Health Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.healthDistribution && Object.keys(stats.healthDistribution).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.healthDistribution).map(([status, count]) => {
                    const total = stats.overview.activeCrops || 1;
                    const pct = Math.round((count / total) * 100);
                    const colors: Record<string, string> = {
                      excellent: 'bg-green-500', good: 'bg-green-400',
                      fair: 'bg-yellow-400', poor: 'bg-orange-500', critical: 'bg-red-500',
                    };
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize text-gray-600 dark:text-gray-400">{status}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{count} crops</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${colors[status] || 'bg-gray-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No crop data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { href: '/dashboard/ai',      icon: '🔬', label: 'Scan Crop' },
                  { href: '/dashboard/weather',  icon: '🌤️', label: 'Weather' },
                  { href: '/dashboard/soil',     icon: '🧪', label: 'Soil Test' },
                  { href: '/dashboard/marketplace', icon: '🛒', label: 'Market' },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-colors text-center"
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">{action.label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent AI Scans */}
          {stats?.recentScans && stats.recentScans.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Scans</CardTitle>
                  <Link href="/dashboard/ai" className="text-xs text-green-600 font-medium">View all</Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.recentScans.slice(0, 3).map((scan) => (
                    <div key={scan._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${scan.result?.isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{scan.cropName}</p>
                        <p className="text-xs text-gray-500 truncate">{scan.result?.diseaseName || 'Pending'}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(scan.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Soil summary */}
      {stats?.latestSoilRecord && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Latest Soil Analysis — {stats.latestSoilRecord.fieldName}</CardTitle>
              <Link href="/dashboard/soil" className="text-sm text-green-600 font-medium">View details →</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { label: 'pH', value: stats.latestSoilRecord.ph.value, unit: '', status: stats.latestSoilRecord.ph.status },
                { label: 'Nitrogen', value: stats.latestSoilRecord.nutrients.nitrogen.value, unit: 'kg/ha', status: stats.latestSoilRecord.nutrients.nitrogen.status },
                { label: 'Phosphorus', value: stats.latestSoilRecord.nutrients.phosphorus.value, unit: 'kg/ha', status: stats.latestSoilRecord.nutrients.phosphorus.status },
                { label: 'Potassium', value: stats.latestSoilRecord.nutrients.potassium.value, unit: 'kg/ha', status: stats.latestSoilRecord.nutrients.potassium.status },
                { label: 'Moisture', value: stats.latestSoilRecord.moisture.value, unit: '%', status: stats.latestSoilRecord.moisture.status },
                { label: 'Organic', value: stats.latestSoilRecord.organicMatter.value, unit: '%', status: stats.latestSoilRecord.organicMatter.status },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{item.value}<span className="text-xs font-normal ml-0.5">{item.unit}</span></p>
                  <p className="text-xs capitalize mt-1 text-green-600">{item.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
