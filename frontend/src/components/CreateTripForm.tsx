'use client';

import { useState, FormEvent } from 'react';
import type { BudgetTier, CreateTripInput } from '@/types';

const INTEREST_OPTIONS = [
  'Food',
  'Culture',
  'Adventure',
  'Shopping',
  'Nature',
  'Nightlife',
  'History',
  'Relaxation',
];

const BUDGET_TIERS: BudgetTier[] = ['Low', 'Medium', 'High'];

interface Props {
  onCreate: (input: CreateTripInput) => Promise<void>;
  busy?: boolean;
}

export default function CreateTripForm({ onCreate, busy }: Props) {
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('Medium');
  const [season, setSeason] = useState('');
  const [interests, setInterests] = useState<string[]>(['Food', 'Culture']);
  const [error, setError] = useState('');

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!destination.trim()) {
      setError('Please enter a destination.');
      return;
    }
    try {
      await onCreate({ destination: destination.trim(), durationDays, budgetTier, interests, season });
      setDestination('');
      setSeason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate the trip.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
    >
      <h2 className="text-lg font-bold">Plan a new trip</h2>

      {error && (
        <div
          role="alert"
          className="text-sm bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg px-3 py-2"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="destination" className="block text-sm text-slate-300 mb-1">
          Destination
        </label>
        <input
          id="destination"
          type="text"
          placeholder="e.g. Tokyo, Japan"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="days" className="block text-sm text-slate-300 mb-1">
            Number of days
          </label>
          <input
            id="days"
            type="number"
            min={1}
            max={30}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="season" className="block text-sm text-slate-300 mb-1">
            Season <span className="text-slate-500">(optional)</span>
          </label>
          <input
            id="season"
            type="text"
            placeholder="e.g. Winter"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <span className="block text-sm text-slate-300 mb-1">Budget</span>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Budget tier">
          {BUDGET_TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              role="radio"
              aria-checked={budgetTier === tier}
              onClick={() => setBudgetTier(tier)}
              className={`rounded-lg py-2 text-sm font-semibold transition border ${
                budgetTier === tier
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-sm text-slate-300 mb-1">Interests</span>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((opt) => {
            const active = interests.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={active}
                onClick={() => toggleInterest(opt)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                  active
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:opacity-60 rounded-lg py-2.5 font-semibold transition"
      >
        {busy ? 'Generating itinerary…' : '✨ Generate itinerary'}
      </button>
    </form>
  );
}
