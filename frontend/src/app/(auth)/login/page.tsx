'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Leaf, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
      toast.success('Welcome back! 🌱');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">GreenPulse</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-gray-500 mb-8">Sign in to your farming dashboard</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="farmer@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-green-600 hover:text-green-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-green-600 hover:text-green-700 font-semibold">
              Create one free
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">🌱 Demo Credentials</p>
            <p className="text-xs text-green-600 dark:text-green-500">Email: farmer@demo.com</p>
            <p className="text-xs text-green-600 dark:text-green-500">Password: demo123</p>
          </div>
        </div>
      </div>

      {/* Right: Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-20" />
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="text-8xl mb-6 animate-float">🌾</div>
          <h2 className="text-4xl font-bold mb-4">Smart Farming Starts Here</h2>
          <p className="text-green-200 text-lg leading-relaxed">
            AI-powered insights for crop health, weather forecasts, soil analysis, and marketplace — all in one platform.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: '🔬', label: 'AI Disease Detection' },
              { icon: '🌤️', label: 'Weather Forecasts' },
              { icon: '🛒', label: 'Marketplace' },
            ].map((item) => (
              <div key={item.label} className="glass rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-xs text-green-200">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
