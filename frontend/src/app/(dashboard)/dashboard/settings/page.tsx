'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Lock, Bell, Palette, MapPin, Tractor } from 'lucide-react';

const profileSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  phone:    z.string().optional(),
  village:  z.string().optional(),
  district: z.string().optional(),
  state:    z.string().optional(),
  pincode:  z.string().optional(),
  farmSize: z.coerce.number().min(0).optional(),
  soilType: z.string().optional(),
  irrigationType: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match", path: ['confirmPassword'],
});

type ProfileForm   = z.infer<typeof profileSchema>;
type PasswordForm  = z.infer<typeof passwordSchema>;

type Tab = 'profile' | 'security' | 'farm' | 'notifications';

export default function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors, isSubmitting: profileSaving } } =
    useForm<ProfileForm>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        name:     user?.name || '',
        phone:    user?.phone || '',
        village:  user?.location?.village || '',
        district: user?.location?.district || '',
        state:    user?.location?.state || '',
        pincode:  user?.location?.pincode || '',
        farmSize: user?.farmDetails?.farmSize || 0,
        soilType: user?.farmDetails?.soilType || 'unknown',
        irrigationType: user?.farmDetails?.irrigationType || 'none',
      },
    });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors, isSubmitting: pwdSaving } } =
    useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSaveProfile = async (data: ProfileForm) => {
    try {
      await updateProfile({
        name: data.name,
        phone: data.phone,
        location: { village: data.village || '', district: data.district || '', state: data.state || '', country: 'India', pincode: data.pincode || '', coordinates: { lat: null, lng: null } },
        farmDetails: { farmSize: data.farmSize || 0, soilType: data.soilType || 'unknown', irrigationType: data.irrigationType || 'none', primaryCrops: user?.farmDetails?.primaryCrops || [] },
      });
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    try {
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      resetPwd();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    }
  };

  const tabs = [
    { id: 'profile' as Tab,       icon: <User className="w-4 h-4" />,       label: 'Profile' },
    { id: 'farm' as Tab,          icon: <Tractor className="w-4 h-4" />,    label: 'Farm Details' },
    { id: 'security' as Tab,      icon: <Lock className="w-4 h-4" />,       label: 'Security' },
    { id: 'notifications' as Tab, icon: <Bell className="w-4 h-4" />,       label: 'Notifications' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
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

      {/* Profile Tab */}
      {tab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role} · {user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input label="Full Name" error={profileErrors.name?.message} {...regProfile('name')} />
                </div>
                <Input label="Phone Number" placeholder="+91 98765 43210" {...regProfile('phone')} />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" /> Location
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Village / Town" placeholder="Your village" {...regProfile('village')} />
                  <Input label="District" placeholder="Your district" {...regProfile('district')} />
                  <Input label="State" placeholder="Your state" {...regProfile('state')} />
                  <Input label="Pincode" placeholder="000000" {...regProfile('pincode')} />
                </div>
              </div>

              <Button type="submit" isLoading={profileSaving}>Save Profile</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Farm Details Tab */}
      {tab === 'farm' && (
        <Card>
          <CardHeader><CardTitle>Farm Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
              <Input label="Farm Size (acres)" type="number" step="0.1" {...regProfile('farmSize')} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Primary Soil Type</label>
                  <select className="input" {...regProfile('soilType')}>
                    {['clay','sandy','loamy','silty','peaty','chalky','unknown'].map(t => (
                      <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Irrigation Type</label>
                  <select className="input" {...regProfile('irrigationType')}>
                    {['drip','sprinkler','flood','rainfed','none'].map(t => (
                      <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" isLoading={profileSaving}>Save Farm Details</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <Card>
          <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePwd(onChangePassword)} className="space-y-4 max-w-sm">
              <Input label="Current Password" type="password" error={pwdErrors.currentPassword?.message} {...regPwd('currentPassword')} />
              <Input label="New Password" type="password" error={pwdErrors.newPassword?.message} {...regPwd('newPassword')} />
              <Input label="Confirm New Password" type="password" error={pwdErrors.confirmPassword?.message} {...regPwd('confirmPassword')} />
              <Button type="submit" isLoading={pwdSaving}>Change Password</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <Card>
          <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Weather Alerts', desc: 'Get notified about extreme weather events' },
                { label: 'Crop Health Updates', desc: 'Weekly crop health summary' },
                { label: 'Marketplace Activity', desc: 'New messages and offers on your listings' },
                { label: 'AI Scan Results', desc: 'When disease detection is complete' },
                { label: 'Market Price Alerts', desc: 'When prices change significantly' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
                  </label>
                </div>
              ))}
              <Button onClick={() => toast.success('Preferences saved!')}>Save Preferences</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
