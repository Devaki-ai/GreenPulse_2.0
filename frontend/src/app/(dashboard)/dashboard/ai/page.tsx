'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/axios';
import type { DiseaseDetection } from '@/types';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner, { PageLoader } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
  Upload, ScanLine, CheckCircle, AlertTriangle, XCircle,
  Leaf, FlaskConical, ChevronDown, ChevronUp, Bot
} from 'lucide-react';

type Tab = 'detect' | 'recommend' | 'history';

export default function AIPage() {
  const [tab, setTab] = useState<Tab>('detect');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropName, setCropName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DiseaseDetection | null>(null);
  const [showTreatments, setShowTreatments] = useState(false);

  // Crop recommendation state
  const [recForm, setRecForm] = useState({ soilType: 'loamy', season: 'kharif', ph: '7', state: '', nitrogen: '', phosphorus: '', potassium: '' });
  const [recLoading, setRecLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<unknown>(null);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleScan = async () => {
    if (!imageFile) return toast.error('Please upload a crop image');
    if (!cropName.trim()) return toast.error('Please enter the crop name');

    try {
      setScanning(true);
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('cropName', cropName);

      const { data } = await api.post('/ai/detect-disease', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.data);
      toast.success('Analysis complete!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Scan failed';
      toast.error(msg);
    } finally {
      setScanning(false);
    }
  };

  const handleRecommend = async () => {
    try {
      setRecLoading(true);
      const { data } = await api.post('/ai/crop-recommendation', {
        soilType: recForm.soilType,
        season: recForm.season,
        ph: parseFloat(recForm.ph) || 7,
        state: recForm.state,
        nitrogen: parseFloat(recForm.nitrogen) || undefined,
        phosphorus: parseFloat(recForm.phosphorus) || undefined,
        potassium: parseFloat(recForm.potassium) || undefined,
      });
      setRecommendations(data.data);
      toast.success('Recommendations ready!');
    } catch {
      toast.error('Failed to get recommendations');
    } finally {
      setRecLoading(false);
    }
  };

  const severityConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    none:     { color: 'text-green-600 bg-green-50 border-green-200',  icon: <CheckCircle className="w-5 h-5" />, label: 'Healthy' },
    mild:     { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <AlertTriangle className="w-5 h-5" />, label: 'Mild' },
    moderate: { color: 'text-orange-600 bg-orange-50 border-orange-200', icon: <AlertTriangle className="w-5 h-5" />, label: 'Moderate' },
    severe:   { color: 'text-red-600 bg-red-50 border-red-200',        icon: <XCircle className="w-5 h-5" />, label: 'Severe' },
    critical: { color: 'text-red-700 bg-red-100 border-red-300',       icon: <XCircle className="w-5 h-5" />, label: 'Critical' },
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'detect',    label: 'Disease Detection', icon: <ScanLine className="w-4 h-4" /> },
    { id: 'recommend', label: 'Crop Recommendation', icon: <Leaf className="w-4 h-4" /> },
    { id: 'history',   label: 'Scan History', icon: <FlaskConical className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bot className="w-7 h-7 text-green-600" /> AI Features
        </h1>
        <p className="text-gray-500 mt-1">Powered by GPT-4 Vision for accurate crop analysis</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Disease Detection Tab */}
      {tab === 'detect' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Upload Crop Image</CardTitle></CardHeader>
              <CardContent>
                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDragActive ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-green-50/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {imagePreview ? (
                    <div className="relative">
                      <Image src={imagePreview} alt="Crop preview" width={400} height={300} className="rounded-xl mx-auto max-h-48 object-cover" />
                      <p className="text-xs text-gray-500 mt-2">Click or drag to replace</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Drop crop image here</p>
                      <p className="text-sm text-gray-400 mt-1">or click to browse (JPG, PNG, WebP · max 10MB)</p>
                    </>
                  )}
                </div>

                {/* Crop name input */}
                <div className="mt-4">
                  <label className="label">Crop Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Tomato, Wheat, Rice..."
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full mt-4"
                  size="lg"
                  leftIcon={<ScanLine className="w-5 h-5" />}
                  onClick={handleScan}
                  isLoading={scanning}
                  disabled={!imageFile || !cropName.trim()}
                >
                  {scanning ? 'Analyzing with AI...' : 'Detect Disease'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results panel */}
          <div>
            {scanning ? (
              <Card className="h-full flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Analyzing with AI...</p>
                  <p className="text-sm text-gray-400 mt-1">This may take a few seconds</p>
                </div>
              </Card>
            ) : result ? (
              <div className="space-y-4">
                {/* Main result */}
                <div className={`card p-6 border-2 ${severityConfig[result.result.severity]?.color || 'border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl ${severityConfig[result.result.severity]?.color}`}>
                      {severityConfig[result.result.severity]?.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        {result.result.isHealthy ? '✅ Crop is Healthy!' : result.result.diseaseName}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">{result.result.diseaseType?.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Confidence Score</span>
                      <span className="font-bold text-gray-900 dark:text-white">{result.result.confidenceScore}% — {result.confidenceLabel}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${result.result.confidenceScore >= 75 ? 'bg-green-500' : result.result.confidenceScore >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${result.result.confidenceScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Severity + Affected area */}
                  {!result.result.isHealthy && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Severity</p>
                        <p className="font-bold capitalize text-gray-900 dark:text-white">{result.result.severity}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Affected Area</p>
                        <p className="font-bold text-gray-900 dark:text-white">{result.result.affectedArea}%</p>
                      </div>
                    </div>
                  )}

                  {/* Symptoms */}
                  {result.result.symptoms?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Symptoms</p>
                      <ul className="space-y-1">
                        {result.result.symptoms.map((s, i) => (
                          <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <span className="text-orange-400 mt-0.5">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Treatments */}
                {!result.result.isHealthy && (
                  <Card>
                    <button
                      className="w-full flex items-center justify-between p-4"
                      onClick={() => setShowTreatments(!showTreatments)}
                    >
                      <span className="font-semibold text-gray-900 dark:text-white">💊 Treatment Plan</span>
                      {showTreatments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showTreatments && (
                      <div className="px-4 pb-4 space-y-4">
                        {result.treatments.immediate?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-red-600 uppercase mb-2">⚡ Immediate Actions</p>
                            <ul className="space-y-1">
                              {result.treatments.immediate.map((t, i) => (
                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"><span className="text-red-400">→</span>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {result.treatments.organic?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-green-600 uppercase mb-2">🌿 Organic Remedies</p>
                            <ul className="space-y-1">
                              {result.treatments.organic.map((t, i) => (
                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"><span className="text-green-400">✓</span>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {result.treatments.chemical?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-blue-600 uppercase mb-2">🧪 Chemical Treatments</p>
                            {result.treatments.chemical.map((c, i) => (
                              <div key={i} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-2">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">{c.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Dosage: {c.dosage} · {c.frequency}</p>
                                <p className="text-xs text-orange-600 mt-1">⚠️ {c.precautions}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {result.treatments.preventive?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-purple-600 uppercase mb-2">🛡️ Prevention Tips</p>
                            <ul className="space-y-1">
                              {result.treatments.preventive.map((t, i) => (
                                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"><span className="text-purple-400">•</span>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[300px]">
                <div className="text-center text-gray-400">
                  <ScanLine className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Upload an image to start analysis</p>
                  <p className="text-sm mt-1">AI will detect diseases and suggest treatments</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Crop Recommendation Tab */}
      {tab === 'recommend' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Soil & Location Details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Soil Type</label>
                    <select className="input" value={recForm.soilType} onChange={e => setRecForm(p => ({ ...p, soilType: e.target.value }))}>
                      {['clay','sandy','loamy','silty','peaty','chalky'].map(t => (
                        <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Season</label>
                    <select className="input" value={recForm.season} onChange={e => setRecForm(p => ({ ...p, season: e.target.value }))}>
                      <option value="kharif">Kharif</option>
                      <option value="rabi">Rabi</option>
                      <option value="zaid">Zaid</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">State / Region</label>
                    <input className="input" placeholder="e.g. Punjab, Maharashtra" value={recForm.state} onChange={e => setRecForm(p => ({ ...p, state: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Soil pH</label>
                    <input className="input" type="number" step="0.1" placeholder="7.0" value={recForm.ph} onChange={e => setRecForm(p => ({ ...p, ph: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">N (kg/ha)</label>
                    <input className="input" type="number" placeholder="0" value={recForm.nitrogen} onChange={e => setRecForm(p => ({ ...p, nitrogen: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">P (kg/ha)</label>
                    <input className="input" type="number" placeholder="0" value={recForm.phosphorus} onChange={e => setRecForm(p => ({ ...p, phosphorus: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">K (kg/ha)</label>
                    <input className="input" type="number" placeholder="0" value={recForm.potassium} onChange={e => setRecForm(p => ({ ...p, potassium: e.target.value }))} />
                  </div>
                </div>
                <Button className="w-full" size="lg" leftIcon={<Leaf className="w-5 h-5" />} onClick={handleRecommend} isLoading={recLoading}>
                  Get AI Recommendations
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations output */}
          {recLoading ? (
            <Card className="flex items-center justify-center min-h-[300px]">
              <LoadingSpinner size="xl" text="AI is analyzing your soil..." />
            </Card>
          ) : recommendations ? (
            <div className="space-y-4">
              {((recommendations as { topCrops?: { name: string; variety: string; suitabilityScore: number; expectedYield: string; waterRequirement: string; profitability: string; reasons: string[]; tips: string[] }[] }).topCrops || []).map((crop, i) => (
                <Card key={i} hover>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{crop.name}</h3>
                        <p className="text-sm text-gray-500">{crop.variety}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-green-600">{crop.suitabilityScore}%</div>
                        <p className="text-xs text-gray-400">Suitability</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                        <p className="text-xs text-gray-400">Yield</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{crop.expectedYield}</p>
                      </div>
                      <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                        <p className="text-xs text-gray-400">Water</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{crop.waterRequirement}</p>
                      </div>
                      <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                        <p className="text-xs text-gray-400">Profit</p>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{crop.profitability}</p>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {crop.reasons.map((r, j) => (
                        <li key={j} className="text-xs text-gray-600 dark:text-gray-400 flex gap-1"><span className="text-green-500">✓</span>{r}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
              {(recommendations as { generalAdvice?: string }).generalAdvice && (
                <Card padding="sm">
                  <p className="text-sm text-gray-700 dark:text-gray-300 p-2">
                    💡 {(recommendations as { generalAdvice: string }).generalAdvice}
                  </p>
                </Card>
              )}
            </div>
          ) : (
            <Card className="flex items-center justify-center min-h-[300px]">
              <div className="text-center text-gray-400">
                <Leaf className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Fill in soil details to get crop recommendations</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && <ScanHistory />}
    </div>
  );
}

function ScanHistory() {
  const [scans, setScans] = useState<DiseaseDetection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai/detections').then(({ data }) => {
      setScans(data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  if (scans.length === 0) {
    return (
      <div className="text-center py-20">
        <FlaskConical className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500">No scans yet. Use Disease Detection to analyze your crops.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {scans.map((scan) => (
        <Card key={scan._id} hover>
          <div className="p-4">
            <div className="flex gap-3 mb-3">
              <Image src={scan.image.url} alt={scan.cropName} width={64} height={64} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">{scan.cropName}</p>
                <p className="text-sm text-gray-500 truncate">{scan.result?.diseaseName || 'Pending'}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={scan.result?.isHealthy ? 'green' : 'red'} dot>
                    {scan.result?.isHealthy ? 'Healthy' : 'Disease'}
                  </Badge>
                </div>
              </div>
            </div>
            {scan.result?.confidenceScore > 0 && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Confidence</span>
                  <span className="font-medium">{scan.result.confidenceScore}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${scan.result.confidenceScore}%` }} />
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
