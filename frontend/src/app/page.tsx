'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const FEATURES = [
  {
    icon: '🧭',
    title: 'AI Day-by-Day Itineraries',
    body: 'Tell us where and how long. Get a structured, interest-aware plan in seconds.',
  },
  {
    icon: '💸',
    title: 'Realistic Budget Estimates',
    body: 'Flights, lodging, food, and activities priced to your Low / Medium / High tier.',
  },
  {
    icon: '🏨',
    title: 'Smart Hotel Picks',
    body: 'Budget, mid-range, and luxury options matched to your destination.',
  },
  {
    icon: '⛈️',
    title: 'Weather-Aware Packing',
    body: 'A checklist generated from your climate AND your planned activities.',
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Trao
        </span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 transition"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Plan your next trip with an{' '}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            AI travel agent
          </span>
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
          Trao builds a complete, editable itinerary with a realistic budget, hotel
          suggestions, and a weather-aware packing list — personalized to your interests.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold transition"
          >
            Start planning free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl border border-slate-700 hover:bg-slate-900 font-semibold transition"
          >
            I already have an account
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-bold mb-2">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
