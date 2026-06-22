'use client';

import { useState } from 'react';
import type { ItineraryDay } from '@/types';

interface Props {
  day: ItineraryDay;
  onAddActivity: (dayNumber: number, title: string) => Promise<void>;
  onRemoveActivity: (dayNumber: number, activityIndex: number) => Promise<void>;
  onRegenerateDay: (dayNumber: number, feedback: string) => Promise<void>;
  regenerating?: boolean;
}

const TIME_BADGE: Record<string, string> = {
  Morning: 'bg-amber-900/40 text-amber-300',
  Afternoon: 'bg-indigo-900/40 text-indigo-300',
  Evening: 'bg-purple-900/40 text-purple-300',
};

export default function ItineraryCard({
  day,
  onAddActivity,
  onRemoveActivity,
  onRegenerateDay,
  regenerating,
}: Props) {
  const [newActivity, setNewActivity] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showRegen, setShowRegen] = useState(false);

  async function handleAdd() {
    if (!newActivity.trim()) return;
    await onAddActivity(day.dayNumber, newActivity.trim());
    setNewActivity('');
  }

  async function handleRegen() {
    if (!feedback.trim()) return;
    await onRegenerateDay(day.dayNumber, feedback.trim());
    setFeedback('');
    setShowRegen(false);
  }

  return (
    <div className="border-l-2 border-indigo-500 pl-6 relative">
      <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-indigo-500 rounded-full border-4 border-slate-900" />

      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="text-lg font-bold text-slate-100">
          Day {day.dayNumber}
          {day.title ? <span className="text-slate-400 font-normal"> — {day.title}</span> : null}
        </h3>
        <button
          type="button"
          onClick={() => setShowRegen((s) => !s)}
          className="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
        >
          🔄 Regenerate day
        </button>
      </div>

      {/* Regenerate-day form */}
      {showRegen && (
        <div className="mb-4 bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
          <label className="text-xs text-slate-400">
            Describe what you want for this day
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder='e.g. "More outdoor hiking, less shopping"'
            rows={2}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleRegen}
            disabled={regenerating}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition"
          >
            {regenerating ? 'Regenerating…' : 'Apply'}
          </button>
        </div>
      )}

      {/* Activity list */}
      <div className="space-y-3 mb-4">
        {day.activities.length === 0 ? (
          <p className="text-xs text-slate-500">No activities yet for this day.</p>
        ) : (
          day.activities.map((act, index) => (
            <div
              key={act._id || index}
              className="group bg-slate-800 p-3 rounded-lg border border-slate-700"
            >
              <div className="flex justify-between items-start gap-3">
                <span className="font-semibold text-white">{act.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {act.timeOfDay && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        TIME_BADGE[act.timeOfDay] || 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {act.timeOfDay}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${act.title}`}
                    onClick={() => onRemoveActivity(day.dayNumber, index)}
                    className="text-slate-500 hover:text-red-400 transition text-sm leading-none"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {act.description && (
                <p className="text-xs text-slate-400 mt-1">{act.description}</p>
              )}
              {act.estimatedCostUSD > 0 && (
                <p className="text-[11px] text-emerald-400 mt-1">
                  ~${act.estimatedCostUSD}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Inline add-activity form */}
      <div className="flex items-center gap-2 max-w-sm">
        <input
          type="text"
          placeholder="Add an activity…"
          value={newActivity}
          onChange={(e) => setNewActivity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="bg-slate-950 border border-slate-800 rounded-lg text-xs px-3 py-1.5 focus:outline-none focus:border-indigo-500 w-full"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition"
        >
          Add
        </button>
      </div>
    </div>
  );
}
