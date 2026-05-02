'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import type { WeatherData } from '@/types';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getWeatherEmoji, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, Wind, Droplets, Eye, Thermometer, MapPin, RefreshCw } from 'lucide-react';

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchWeather = async (cityName: string) => {
    if (!cityName.trim()) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/weather?city=${encodeURIComponent(cityName)}`);
      setWeather(data.data);
      setCity(cityName);
    } catch {
      toast.error('Could not fetch weather. Check city name.');
    } finally {
      setLoading(false);
    }
  };

  // Load default city on mount
  useEffect(() => { fetchWeather('Mumbai'); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) fetchWeather(searchInput.trim());
  };

  const conditionBg: Record<string, string> = {
    clear:  'from-yellow-400 to-orange-400',
    cloudy: 'from-gray-400 to-gray-500',
    rainy:  'from-blue-500 to-blue-700',
    stormy: 'from-gray-700 to-gray-900',
    foggy:  'from-gray-300 to-gray-400',
    snowy:  'from-blue-200 to-blue-300',
    windy:  'from-teal-400 to-cyan-500',
    hazy:   'from-yellow-300 to-orange-300',
  };

  const farmingIcons: Record<string, string> = {
    irrigation: '💧', pestControl: '🐛', harvesting: '✂️', planting: '🌱', general: '🌿',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weather Forecast</h1>
          <p className="text-gray-500 mt-1">Real-time weather with AI farming recommendations</p>
        </div>
        <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => fetchWeather(city || 'Mumbai')}>
          Refresh
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch}>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search city (e.g. Delhi, Pune, Hyderabad)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" leftIcon={<Search className="w-4 h-4" />} isLoading={loading}>
            Search
          </Button>
        </div>
      </form>

      {loading && !weather ? (
        <PageLoader />
      ) : weather ? (
        <>
          {/* Current Weather Hero */}
          <div className={`rounded-3xl bg-gradient-to-br ${conditionBg[weather.current.condition] || 'from-green-500 to-green-700'} p-8 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 text-[120px] opacity-20 leading-none">
              {getWeatherEmoji(weather.current.condition)}
            </div>
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {weather.location.city}, {weather.location.country}
                  </p>
                  <div className="flex items-end gap-3 mt-2">
                    <span className="text-7xl font-black">{weather.current.temperature}°</span>
                    <div className="mb-3">
                      <p className="text-white/90 capitalize text-lg">{weather.current.description}</p>
                      <p className="text-white/70 text-sm">Feels like {weather.current.feelsLike}°C</p>
                    </div>
                  </div>
                </div>
                <div className="text-6xl">{getWeatherEmoji(weather.current.condition)}</div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {[
                  { icon: <Droplets className="w-4 h-4" />, label: 'Humidity',   value: `${weather.current.humidity}%` },
                  { icon: <Wind className="w-4 h-4" />,     label: 'Wind',       value: `${weather.current.windSpeed} m/s` },
                  { icon: <Eye className="w-4 h-4" />,      label: 'Visibility', value: `${(weather.current.visibility / 1000).toFixed(1)} km` },
                  { icon: <Thermometer className="w-4 h-4" />, label: 'Pressure', value: `${weather.current.pressure} hPa` },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
                    <div className="flex justify-center mb-1 text-white/80">{stat.icon}</div>
                    <p className="text-white font-bold text-sm">{stat.value}</p>
                    <p className="text-white/70 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 7-Day Forecast */}
          <Card>
            <CardHeader><CardTitle>7-Day Forecast</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {weather.forecast.map((day, i) => (
                  <div key={i} className={`text-center p-3 rounded-2xl transition-all ${i === 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/10'}`}>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      {i === 0 ? 'Today' : formatDate(day.date, 'EEE')}
                    </p>
                    <div className="text-2xl my-2">{getWeatherEmoji(day.condition)}</div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{day.tempMax}°</p>
                    <p className="text-xs text-gray-400">{day.tempMin}°</p>
                    {day.precipitationProbability > 20 && (
                      <p className="text-xs text-blue-500 mt-1">💧 {day.precipitationProbability}%</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Farming Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>🌾 AI Farming Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(weather.farmingRecommendations).map(([key, value]) => (
                  <div key={key} className="flex gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <span className="text-2xl flex-shrink-0">{farmingIcons[key] || '🌿'}</span>
                    <div>
                      <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1 capitalize">{key}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Forecast farming tips */}
          {weather.forecast.some(d => d.farmingAdvice) && (
            <Card>
              <CardHeader><CardTitle>Daily Farming Tips</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {weather.forecast.filter(d => d.farmingAdvice).map((day, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <span className="text-lg">{getWeatherEmoji(day.condition)}</span>
                      <span className="text-xs font-semibold text-gray-500 w-12 flex-shrink-0">{formatDate(day.date, 'EEE dd')}</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{day.farmingAdvice}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
