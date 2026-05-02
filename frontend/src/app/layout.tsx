import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'GreenPulse 🌱 - AI-Powered Smart Agriculture',
    template: '%s | GreenPulse',
  },
  description:
    'GreenPulse is an AI-powered smart agriculture platform helping farmers with crop disease detection, weather forecasts, soil analysis, and marketplace.',
  keywords: ['agriculture', 'farming', 'AI', 'crop disease', 'weather', 'soil', 'marketplace', 'GreenPulse'],
  authors: [{ name: 'GreenPulse Team' }],
  openGraph: {
    title: 'GreenPulse - AI-Powered Smart Agriculture',
    description: 'Empowering farmers with AI-driven insights for better yields.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#1a1a1a',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#16a34a', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#dc2626', secondary: '#fff' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
