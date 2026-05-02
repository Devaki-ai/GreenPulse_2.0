'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Leaf, ArrowRight, Sprout, CloudSun, ShoppingBag, Bot, Shield, TrendingUp, Star, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';

const features = [
  { icon: '🔬', title: 'AI Disease Detection', desc: 'Upload a photo of your crop and get instant disease diagnosis with treatment recommendations powered by GPT-4 Vision.' },
  { icon: '🌤️', title: 'Weather Forecasts', desc: '7-day weather forecasts with AI-generated farming recommendations tailored to your location and crops.' },
  { icon: '🧪', title: 'Soil Health Tracker', desc: 'Track NPK levels, pH, moisture, and organic matter. Get AI suggestions for soil amendments and suitable crops.' },
  { icon: '🌾', title: 'Crop Management', desc: 'Monitor growth stages, health scores, and get personalized insights for every crop on your farm.' },
  { icon: '🛒', title: 'Marketplace', desc: 'Buy and sell crops, fertilizers, seeds, and equipment directly with other farmers and buyers.' },
  { icon: '🤖', title: 'GreenBot AI', desc: 'Chat with our AI farming assistant 24/7 for advice on crops, pests, weather, and government schemes.' },
];

const stats = [
  { value: '10,000+', label: 'Farmers Registered' },
  { value: '50,000+', label: 'Crops Monitored' },
  { value: '95%',     label: 'Disease Detection Accuracy' },
  { value: '₹2Cr+',  label: 'Marketplace Transactions' },
];

const testimonials = [
  { name: 'Rajesh Kumar', location: 'Punjab', text: 'GreenPulse detected early blight in my tomatoes before I could even see it. Saved my entire harvest!', rating: 5 },
  { name: 'Priya Sharma', location: 'Maharashtra', text: 'The weather recommendations helped me plan my irrigation perfectly. My water usage dropped by 30%.', rating: 5 },
  { name: 'Suresh Patel', location: 'Gujarat', text: 'Sold my entire cotton crop through the marketplace at 15% better price than local mandi.', rating: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="page-container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">GreenPulse</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'Testimonials', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/register"><Button size="sm">Get Started Free</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-hero overflow-hidden pt-16">
        <div className="absolute inset-0 leaf-pattern opacity-10" />
        {/* Animated circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-green-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-green-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="page-container relative z-10 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-300 text-sm font-medium">AI-Powered Smart Agriculture Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Farm Smarter with{' '}
              <span className="text-green-400">AI</span>
            </h1>

            <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Detect crop diseases instantly, get weather-based farming advice, track soil health, and sell your produce — all powered by AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-green-500 hover:bg-green-400 text-white border-0 shadow-lg shadow-green-900/30 px-8">
                  Start Farming Smart <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {stats.map((stat) => (
                <div key={stat.label} className="glass rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-green-300 text-xs mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-green-400" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="section-title">Everything a Farmer Needs</h2>
            <p className="section-subtitle mx-auto">
              From AI disease detection to marketplace — GreenPulse is your complete digital farming companion.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="card-hover p-6 group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-gray-950">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="section-title">Get Started in 3 Steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', icon: '📝', title: 'Create Account', desc: 'Sign up free as a farmer or buyer in under 2 minutes.' },
              { step: '02', icon: '🌾', title: 'Add Your Crops', desc: 'Add your crops, soil data, and farm location to get personalized insights.' },
              { step: '03', icon: '🚀', title: 'Farm Smarter', desc: 'Use AI detection, weather forecasts, and marketplace to maximize your yield.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-5xl font-black text-green-100 dark:text-green-900/50 mb-2">{item.step}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-green-50 dark:bg-green-950/20">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="section-title">Farmers Love GreenPulse</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 leaf-pattern opacity-10" />
        <div className="page-container relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-green-200 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of farmers already using GreenPulse to grow smarter, earn more, and farm sustainably.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 border-0 shadow-xl px-10">
              Start Free Today <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="page-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">GreenPulse</span>
            </div>
            <p className="text-sm">© 2024 GreenPulse. Built with 💚 for Indian farmers.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-green-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-green-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-green-400 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
