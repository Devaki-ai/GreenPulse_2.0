'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Users, Sprout, ShoppingBag, ScanLine, TrendingUp, MapPin } from 'lucide-react';

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#0ea5e9', '#d4851e'];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(({ data }) => setAnalytics(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!analytics) return <div className="p-6 text-gray-500">Failed to load analytics.</div>;

  const overview = analytics.overview as Record<string, number>;
  const userGrowth = (analytics.userGrowth as { _id: { month: number }; count: number }[]).map(g => ({
    month: MONTH_NAMES[(g._id.month - 1)],
    users: g.count,
  }));
  const cropDist = (analytics.cropDistribution as { _id: string; count: number }[]).map(c => ({
    name: c._id || 'other', value: c.count,
  }));
  const productDist = (analytics.productDistribution as { _id: string; count: number; avgPrice: number }[]).map(p => ({
    name: p._id || 'other', count: p.count, avgPrice: Math.round(p.avgPrice || 0),
  }));
  const topStates = (analytics.topStates as { _id: string; count: number }[]).slice(0, 8);
  const diseaseStats = (analytics.diseaseStats as { _id: string; count: number; avgConfidence: number }[]).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
        <p className="text-gray-500 mt-1">Real-time overview of GreenPulse activity</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"    value={overview.totalUsers}    icon={<Users />}      color="green"  change={`${overview.newUsersThisMonth} this month`} changeType="up" />
        <StatCard title="Farmers"        value={overview.totalFarmers}  icon={<Sprout />}     color="blue"   />
        <StatCard title="Active Listings"value={overview.activeProducts}icon={<ShoppingBag />}color="orange" change={`${overview.totalProducts} total`} changeType="neutral" />
        <StatCard title="AI Scans"       value={overview.totalScans}    icon={<ScanLine />}   color="purple" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <CardTitle>User Growth (Last 6 Months)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#16a34a" strokeWidth={3} dot={{ r: 5, fill: '#16a34a' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No growth data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Crop Distribution */}
        <Card>
          <CardHeader><CardTitle>Crop Categories</CardTitle></CardHeader>
          <CardContent>
            {cropDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={cropDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {cropDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No crop data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketplace by category */}
        <Card>
          <CardHeader><CardTitle>Marketplace by Category</CardTitle></CardHeader>
          <CardContent>
            {productDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={productDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No marketplace data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top States */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <CardTitle>Top States by Farmers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {topStates.length > 0 ? (
              <div className="space-y-3">
                {topStates.map((s, i) => {
                  const max = topStates[0].count;
                  return (
                    <div key={s._id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{s._id}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{s.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all duration-700"
                          style={{ width: `${(s.count / max) * 100}%`, opacity: 1 - i * 0.08 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No location data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Diseases */}
      {diseaseStats.length > 0 && (
        <Card>
          <CardHeader><CardTitle>🔬 Most Detected Diseases</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Disease</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">Detections</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">Avg Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {diseaseStats.map((d, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{d._id || 'Unknown'}</td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{d.count}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${d.avgConfidence >= 75 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {Math.round(d.avgConfidence)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
