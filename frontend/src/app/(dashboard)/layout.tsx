'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GreenBot from '@/components/chatbot/GreenBot';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, getMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    getMe();
  }, [getMe]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner fullPage text="Loading GreenPulse..." />;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="page-enter">
          {children}
        </div>
      </main>
      {/* GreenBot AI Chatbot — available on all dashboard pages */}
      <GreenBot />
    </div>
  );
}
