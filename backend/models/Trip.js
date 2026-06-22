const mongoose = require('mongoose');

// A Trip is a self-contained document: itinerary days, hotels, budget, and the
// packing list all live inline. This document shape maps naturally to how the
// dashboard renders a trip, avoiding cross-collection joins.

/* A single activity within a day. */
const ActivitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  estimatedCostUSD: { type: Number, default: 0 },
  timeOfDay: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening'],
    default: 'Morning',
  },
});

/* A single packing-list item (Creative Feature). */
const PackingItemSchema = new mongoose.Schema({
  item: { type: String, required: true },
  category: {
    type: String,
    enum: ['Documents', 'Clothing', 'Gear', 'Other'],
    default: 'Other',
  },
  // The reason this item was suggested — surfaced in the UI for transparency.
  reason: { type: String, default: '' },
  isPacked: { type: Boolean, default: false },
});

const TripSchema = new mongoose.Schema(
  {
    // Ties every trip to exactly one owner. The cornerstone of data isolation.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: { type: String, required: true, trim: true },
    durationDays: { type: Number, required: true, min: 1, max: 30 },
    budgetTier: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
    },
    interests: [{ type: String }],
    // Optional travel season (used by the weather-aware packing feature).
    season: { type: String, default: '' },

    itinerary: [
      {
        dayNumber: { type: Number, required: true },
        title: { type: String, default: '' },
        activities: [ActivitySchema],
      },
    ],

    hotels: [
      {
        name: { type: String, required: true },
        tier: { type: String, default: '' },
        estimatedCostNightUSD: { type: Number, default: 0 },
        rating: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],

    estimatedBudget: {
      flights: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },

    // Creative Feature: weather-aware packing checklist.
    packingList: [PackingItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', TripSchema);
