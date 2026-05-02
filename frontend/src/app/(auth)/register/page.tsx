'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Leaf, Mail, Lock, User, Phone } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const registerSchema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Please enter a valid email'),
  password:        z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role:            z.enum(['farmer', 'buyer']),
  phone:           z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'farmer' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    try {
      const { confirmPassword, ...registerData } = data;
      void confirmPassword;
      await registerUser(registerData);
      toast.success('Welcome to GreenPulse! 🌱');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-20" />
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="text-8xl mb-6 animate-float">🌱</div>
          <h2 className="text-4xl font-bold mb-4">Join 10,000+ Farmers</h2>
          <p className="text-green-200 text-lg leading-relaxed">
            Get AI-powered crop insights, real-time weather updates, and connect with buyers — all for free.
          </p>
          <div className="mt-8 space-y-3">
            {[
              '✅ Free AI crop disease detection',
              '✅ 7-day weather forecasts',
              '✅ Soil health tracking',
              '✅ Direct marketplace access',
            ].map((item) => (
              <p key={item} className="text-green-200 text-sm">{item}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-950 overflow-y-auto">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">GreenPulse</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h1>
          <p className="text-gray-500 mb-8">Start your smart farming journey today</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['farmer', 'buyer'] as const).map((role) => (
              <label
                key={role}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === role
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                }`}
              >
                <input type="radio" value={role} {...register('role')} className="sr-only" />
                <span className="text-2xl">{role === 'farmer' ? '👨‍🌾' : '🛒'}</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{role}</p>
                  <p className="text-xs text-gray-500">{role === 'farmer' ? 'Grow & sell crops' : 'Buy farm products'}</p>
                </div>
              </label>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Rajesh Kumar"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email address"
              type="email"
              placeholder="farmer@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+91 98765 43210"
              leftIcon={<Phone className="w-4 h-4" />}
              {...register('phone')}
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
