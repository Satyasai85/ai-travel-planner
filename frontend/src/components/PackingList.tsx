'use client';

import type { PackingItem } from '@/types';

// Creative feature UI: groups AI-generated items by category and shows the
// "reason" behind each suggestion. Toggling an item persists via the parent.
interface Props {
  items: PackingItem[];
  onToggle: (index: number) => void;
}

const CATEGORY_ORDER: PackingItem['category'][] = [
  'Documents',
  'Clothing',
  'Gear',
  'Other',
];

const CATEGORY_LABEL: Record<string, string> = {
  Documents: '🛂 Crucial Travel Documents',
  Clothing: '🧥 Climate Wear',
  Gear: '🥾 Activity-Specific Gear',
  Other: '🎒 Other Essentials',
};

export default function PackingList({ items, onToggle }: Props) {
  if (!items || items.length === 0) {
    return (
      <p className="text-xs text-slate-500">No packing items generated for this trip.</p>
    );
  }

  const packedCount = items.filter((i) => i.isPacked).length;

  // Build category -> items map while preserving each item's original index
  // (needed so the toggle handler can target the right element).
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    entries: items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.category === category),
  })).filter((g) => g.entries.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400">
          Generated from your destination&apos;s climate AND your planned activities.
        </p>
        <span className="text-xs font-semibold text-emerald-400">
          {packedCount}/{items.length} packed
        </span>
      </div>

      <div className="space-y-5">
        {grouped.map(({ category, entries }) => (
          <div key={category}>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
              {CATEGORY_LABEL[category]}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entries.map(({ item, index }) => (
                <button
                  key={item._id || index}
                  type="button"
                  onClick={() => onToggle(index)}
                  aria-pressed={item.isPacked}
                  className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-750 transition text-left"
                >
                  <input
                    type="checkbox"
                    checked={item.isPacked}
                    readOnly
                    tabIndex={-1}
                    className="h-4 w-4 rounded accent-emerald-500 pointer-events-none"
                  />
                  <div className="min-w-0">
                    <span
                      className={`text-sm block ${
                        item.isPacked ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {item.item}
                    </span>
                    {item.reason && (
                      <span className="text-[11px] text-slate-500 block truncate">
                        {item.reason}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
