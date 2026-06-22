'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { tripApi } from '@/utils/api';
import type { CreateTripInput, Trip } from '@/types';
import CreateTripForm from '@/components/CreateTripForm';
import ItineraryCard from '@/components/ItineraryCard';
import PackingList from '@/components/PackingList';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [regenDay, setRegenDay] = useState<number | null>(null);
  const [error, setError] = useState('');

  const selectedTrip = trips.find((t) => t._id === selectedId) || null;

  // Route guard: bounce unauthenticated users to login once auth state resolves.
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const loadTrips = useCallback(async () => {
    try {
      const data = await tripApi.list();
      setTrips(data);
      setSelectedId((prev) => prev || (data.length > 0 ? data[0]._id : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trips.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadTrips();
  }, [user, loadTrips]);

  /** Replace a trip in local state after an update returns from the API. */
  function applyTripUpdate(updated: Trip) {
    setTrips((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  }

  async function handleCreate(input: CreateTripInput) {
    setCreating(true);
    setError('');
    try {
      const trip = await tripApi.create(input);
      setTrips((prev) => [trip, ...prev]);
      setSelectedId(trip._id);
    } finally {
      setCreating(false);
    }
  }

  async function handleAddActivity(dayNumber: number, title: string) {
    if (!selectedTrip) return;
    const itinerary = selectedTrip.itinerary.map((day) =>
      day.dayNumber === dayNumber
        ? {
            ...day,
            activities: [
              ...day.activities,
              { title, description: 'Added by traveler', estimatedCostUSD: 0, timeOfDay: 'Afternoon' as const },
            ],
          }
        : day
    );
    const updated = await tripApi.update(selectedTrip._id, { itinerary });
    applyTripUpdate(updated);
  }

  async function handleRemoveActivity(dayNumber: number, activityIndex: number) {
    if (!selectedTrip) return;
    const itinerary = selectedTrip.itinerary.map((day) =>
      day.dayNumber === dayNumber
        ? { ...day, activities: day.activities.filter((_, i) => i !== activityIndex) }
        : day
    );
    const updated = await tripApi.update(selectedTrip._id, { itinerary });
    applyTripUpdate(updated);
  }

  async function handleRegenerateDay(dayNumber: number, feedback: string) {
    if (!selectedTrip) return;
    setRegenDay(dayNumber);
    try {
      const updated = await tripApi.regenerateDay(selectedTrip._id, dayNumber, feedback);
      applyTripUpdate(updated);
    } finally {
      setRegenDay(null);
    }
  }

  async function handleTogglePacking(index: number) {
    if (!selectedTrip) return;
    const packingList = selectedTrip.packingList.map((item, i) =>
      i === index ? { ...item, isPacked: !item.isPacked } : item
    );
    // Optimistic update for snappy UX.
    applyTripUpdate({ ...selectedTrip, packingList });
    const updated = await tripApi.update(selectedTrip._id, { packingList });
    applyTripUpdate(updated);
  }

  async function handleDelete(id: string) {
    await tripApi.remove(id);
    setTrips((prev) => {
      const next = prev.filter((t) => t._id !== id);
      if (selectedId === id) setSelectedId(next[0]?._id || null);
      return next;
    });
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950 text-white">
        <p className="text-xl animate-pulse">Loading your trips…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      <header className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-between items-center border-b border-slate-800 pb-5 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Trao Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Signed in as {user?.name} ({user?.email})
          </p>
        </div>
        <button
          onClick={logout}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 transition text-white px-4 py-2 rounded-lg text-sm"
        >
          Sign out
        </button>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto mb-6 text-sm bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: create + select + budget */}
        <div className="space-y-6">
          <CreateTripForm onCreate={handleCreate} busy={creating} />

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Your trips</h2>
            {trips.length === 0 ? (
              <p className="text-slate-500 text-sm">No itineraries yet. Create one above!</p>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => (
                  <div
                    key={trip._id}
                    className={`rounded-xl border transition ${
                      selectedId === trip._id
                        ? 'bg-blue-600/90 border-blue-500'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex items-center justify-between p-4">
                      <button
                        onClick={() => setSelectedId(trip._id)}
                        className="text-left flex-1"
                      >
                        <p className="font-bold">{trip.destination}</p>
                        <p className="text-xs opacity-80">
                          {trip.durationDays} days • {trip.budgetTier} budget
                        </p>
                      </button>
                      <button
                        aria-label={`Delete trip to ${trip.destination}`}
                        onClick={() => handleDelete(trip._id)}
                        className="text-slate-300 hover:text-red-300 text-sm ml-2"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedTrip && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Estimated budget</h2>
              <div className="space-y-2 text-sm">
                <Row label="✈️ Flights" value={selectedTrip.estimatedBudget.flights} />
                <Row label="🚕 Transport" value={selectedTrip.estimatedBudget.transport} />
                <Row label="🏨 Accommodation" value={selectedTrip.estimatedBudget.accommodation} />
                <Row label="🍜 Food" value={selectedTrip.estimatedBudget.food} />
                <Row label="🎟️ Activities" value={selectedTrip.estimatedBudget.activities} />
                <div className="flex justify-between border-t border-slate-800 pt-3 mt-2 text-white font-bold">
                  <span>Total estimated</span>
                  <span>${selectedTrip.estimatedBudget.total}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: itinerary + hotels + packing */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTrip ? (
            <>
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6 border-b border-slate-800 pb-3">
                  Itinerary: {selectedTrip.destination}
                </h2>
                <div className="space-y-8">
                  {selectedTrip.itinerary.map((day) => (
                    <ItineraryCard
                      key={day.dayNumber}
                      day={day}
                      onAddActivity={handleAddActivity}
                      onRemoveActivity={handleRemoveActivity}
                      onRegenerateDay={handleRegenerateDay}
                      regenerating={regenDay === day.dayNumber}
                    />
                  ))}
                </div>
              </section>

              {selectedTrip.hotels?.length > 0 && (
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">🏨 Recommended hotels</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedTrip.hotels.map((hotel, i) => (
                      <div
                        key={hotel._id || i}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-4"
                      >
                        <p className="font-bold text-white">{hotel.name}</p>
                        <p className="text-xs text-indigo-300 mt-0.5">{hotel.tier}</p>
                        {hotel.description && (
                          <p className="text-xs text-slate-400 mt-2">{hotel.description}</p>
                        )}
                        <div className="flex justify-between items-center mt-3 text-xs">
                          <span className="text-emerald-400">
                            ${hotel.estimatedCostNightUSD}/night
                          </span>
                          <span className="text-amber-300">⭐ {hotel.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-1">⛈️ AI Weather-Aware Packing Assistant</h2>
                <PackingList
                  items={selectedTrip.packingList}
                  onToggle={handleTogglePacking}
                />
              </section>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-96 bg-slate-900 border border-slate-800 rounded-2xl text-center px-6">
              <span className="text-6xl mb-4">✈️</span>
              <p className="text-slate-400">
                Create a new trip on the left to generate your first AI itinerary.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold">${value}</span>
    </div>
  );
}
