const Trip = require('../models/Trip');
const { generateTripPlan, regenerateDay } = require('../services/geminiService');

/* --------------------------------------------------------------------------
 * NOTE ON DATA ISOLATION
 * Every read/write below is scoped with `userId: req.user.id`. There is no code
 * path that can return or mutate a trip belonging to another user, even if a
 * valid id from another account is supplied — the query simply matches nothing.
 * ------------------------------------------------------------------------- */

/**
 * Recompute the budget total from its parts to keep it internally consistent.
 * Never trust the `total` sent by the model or client — always derive it here.
 */
function withConsistentTotal(budget = {}) {
  const flights = Number(budget.flights) || 0;
  const transport = Number(budget.transport) || 0;
  const accommodation = Number(budget.accommodation) || 0;
  const food = Number(budget.food) || 0;
  const activities = Number(budget.activities) || 0;
  return {
    flights,
    transport,
    accommodation,
    food,
    activities,
    total: flights + transport + accommodation + food + activities,
  };
}

/**
 * POST /api/trips
 * Generate a brand-new AI itinerary and persist it for the authenticated user.
 */
exports.generateTrip = async (req, res, next) => {
  try {
    const { destination, durationDays, budgetTier, interests, season } = req.body;

    if (!destination || !durationDays || !budgetTier) {
      return res
        .status(400)
        .json({ message: 'destination, durationDays, and budgetTier are required.' });
    }
    if (!['Low', 'Medium', 'High'].includes(budgetTier)) {
      return res.status(400).json({ message: 'budgetTier must be Low, Medium, or High.' });
    }

    const plan = await generateTripPlan({
      destination,
      durationDays: Number(durationDays),
      budgetTier,
      interests: Array.isArray(interests) ? interests : [],
      season,
    });

    const trip = await Trip.create({
      userId: req.user.id,
      destination,
      durationDays: Number(durationDays),
      budgetTier,
      interests: Array.isArray(interests) ? interests : [],
      season: season || '',
      itinerary: plan.itinerary || [],
      hotels: plan.hotels || [],
      estimatedBudget: withConsistentTotal(plan.estimatedBudget),
      packingList: plan.packingList || [],
    });

    return res.status(201).json(trip);
  } catch (error) {
    if (error.message && error.message.startsWith('Gemini')) {
      return res.status(502).json({
        message: 'The AI service is temporarily unavailable. Please try again in a moment.',
      });
    }
    return next(error);
  }
};

/** GET /api/trips — list all trips owned by the authenticated user. */
exports.getTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(trips);
  } catch (error) {
    return next(error);
  }
};

/** GET /api/trips/:id — fetch one owned trip. */
exports.getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }
    return res.json(trip);
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/trips/:id
 * Generic update for client-driven edits (reordering, toggling packing items,
 * inline-added activities, hotel edits). Only whitelisted fields may change;
 * userId is never reassignable.
 */
exports.updateTrip = async (req, res, next) => {
  try {
    const allowed = ['itinerary', 'hotels', 'packingList', 'estimatedBudget', 'interests'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.estimatedBudget) {
      updates.estimatedBudget = withConsistentTotal(updates.estimatedBudget);
    }

    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }
    return res.json(trip);
  } catch (error) {
    return next(error);
  }
};

/** DELETE /api/trips/:id — delete one owned trip. */
exports.deleteTrip = async (req, res, next) => {
  try {
    const result = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) {
      return res.status(404).json({ message: 'Trip not found.' });
    }
    return res.json({ message: 'Trip deleted.', id: req.params.id });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/trips/:id/days/:dayNumber/regenerate
 * Ask the LLM to rebuild a single day from a natural-language instruction.
 */
exports.regenerateDay = async (req, res, next) => {
  try {
    const { feedback } = req.body;
    const dayNumber = Number(req.params.dayNumber);

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ message: 'A "feedback" instruction is required.' });
    }

    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    const newDay = await regenerateDay({
      destination: trip.destination,
      budgetTier: trip.budgetTier,
      interests: trip.interests,
      season: trip.season,
      dayNumber,
      feedback,
    });

    const idx = trip.itinerary.findIndex((d) => d.dayNumber === dayNumber);
    if (idx === -1) {
      return res.status(404).json({ message: `Day ${dayNumber} does not exist in this trip.` });
    }

    trip.itinerary[idx] = {
      dayNumber,
      title: newDay.title || trip.itinerary[idx].title,
      activities: newDay.activities || [],
    };

    await trip.save();
    return res.json(trip);
  } catch (error) {
    if (error.message && error.message.startsWith('Gemini')) {
      return res.status(502).json({
        message: 'The AI service is temporarily unavailable. Please try again in a moment.',
      });
    }
    return next(error);
  }
};
