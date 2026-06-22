// Shared type contract between the UI and the API. These mirror the backend
// Mongoose schemas so request/response payloads stay type-checked end to end.
export type BudgetTier = 'Low' | 'Medium' | 'High';
export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening';
export type PackingCategory = 'Documents' | 'Clothing' | 'Gear' | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Activity {
  _id?: string;
  title: string;
  description: string;
  estimatedCostUSD: number;
  timeOfDay: TimeOfDay;
}

export interface ItineraryDay {
  _id?: string;
  dayNumber: number;
  title?: string;
  activities: Activity[];
}

export interface Hotel {
  _id?: string;
  name: string;
  tier: string;
  estimatedCostNightUSD: number;
  rating: string;
  description?: string;
}

export interface PackingItem {
  _id?: string;
  item: string;
  category: PackingCategory;
  reason?: string;
  isPacked: boolean;
}

export interface EstimatedBudget {
  flights: number;
  transport: number;
  accommodation: number;
  food: number;
  activities: number;
  total: number;
}

export interface Trip {
  _id: string;
  userId: string;
  destination: string;
  durationDays: number;
  budgetTier: BudgetTier;
  interests: string[];
  season?: string;
  itinerary: ItineraryDay[];
  hotels: Hotel[];
  estimatedBudget: EstimatedBudget;
  packingList: PackingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  destination: string;
  durationDays: number;
  budgetTier: BudgetTier;
  interests: string[];
  season?: string;
}
