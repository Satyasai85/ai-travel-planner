/**
 * Gemini AI service layer.
 *
 * Encapsulates ALL communication with Google's Generative Language API so that
 * controllers stay thin and free of vendor-specific details. If the AI provider
 * ever changes, only this file needs to be touched.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Resilient fetch with exponential backoff.
 *
 * Retries on transient failures (HTTP 429 / 5xx and network errors) with
 * progressively longer delays: 1s, 2s, 4s, 8s, 16s. This shields the app from
 * temporary rate-limit and availability blips on the upstream API.
 */
async function fetchWithRetry(url, options, retries = 5, delay = 1000) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && retries > 0) {
        console.warn(
          `Gemini API ${response.status}. Retrying in ${delay}ms (${retries} left).`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      const body = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${body.slice(0, 300)}`);
    }

    return response.json();
  } catch (error) {
    // Network-level error — retry if budget remains.
    if (retries > 0) {
      console.warn(`Gemini request failed (${error.message}). Retrying in ${delay}ms.`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Low-level call: send a prompt, force JSON output, and return the parsed object.
 */
async function generateJSON(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  };

  const data = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty or malformed response.');
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    // Defensive: strip markdown fences the model occasionally adds despite JSON mode.
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  }
}

/* ---------------------------- Prompt builders ----------------------------- */

function budgetGuidance(tier) {
  switch (tier) {
    case 'Low':
      return 'Backpacker / budget profile: hostels & guesthouses, street food, public transit, free or low-cost attractions.';
    case 'High':
      return 'Luxury profile: 4–5 star hotels, fine dining, private transfers, premium guided experiences.';
    default:
      return 'Mid-range profile: comfortable 3-star hotels, a mix of casual and nice restaurants, mix of public and private transport.';
  }
}

/**
 * Generate a complete trip plan: itinerary, hotels, budget, and packing list.
 */
async function generateTripPlan({ destination, durationDays, budgetTier, interests, season }) {
  const prompt = `
You are an expert travel planner. Create a detailed, realistic travel plan.

TRIP DETAILS
- Destination: ${destination}
- Duration: ${durationDays} day(s)
- Budget tier: ${budgetTier} — ${budgetGuidance(budgetTier)}
- Traveler interests: ${interests && interests.length ? interests.join(', ') : 'general sightseeing'}
- Travel season: ${season || 'unspecified — assume the most common tourist season'}

REQUIREMENTS
1. Produce exactly ${durationDays} itinerary day(s), each with 2–4 realistic activities tied to the interests.
2. Suggest 3 hotels spanning Budget, Mid-Range, and Luxury tiers near the destination.
3. Estimate a realistic budget IN USD for the WHOLE trip, matching the ${budgetTier} tier and local price levels.
4. Build a WEATHER-AWARE packing list. Cross-reference the destination's climate for the given season AND the
   planned activities. Each item must include a short "reason". Categories: Documents, Clothing, Gear, Other.

Output ONLY valid JSON in EXACTLY this shape (no markdown, no commentary):
{
  "itinerary": [
    {
      "dayNumber": 1,
      "title": "Short theme for the day",
      "activities": [
        { "title": "Activity name", "description": "1-2 sentence detail", "estimatedCostUSD": 20, "timeOfDay": "Morning" }
      ]
    }
  ],
  "hotels": [
    { "name": "Hotel name", "tier": "Budget", "estimatedCostNightUSD": 85, "rating": "4.5/5", "description": "Why it fits" }
  ],
  "estimatedBudget": {
    "flights": 400,
    "transport": 120,
    "accommodation": 300,
    "food": 150,
    "activities": 100,
    "total": 1070
  },
  "packingList": [
    { "item": "Passport", "category": "Documents", "reason": "Required for international travel", "isPacked": false }
  ]
}
"timeOfDay" must be one of: Morning, Afternoon, Evening.
The "total" must equal the sum of flights, transport, accommodation, food, and activities.
`;

  return generateJSON(prompt);
}

/**
 * Regenerate a single day given user feedback, preserving the rest of the trip context.
 */
async function regenerateDay({ destination, budgetTier, interests, dayNumber, feedback, season }) {
  const prompt = `
You are an expert travel planner refining ONE day of an existing trip.

CONTEXT
- Destination: ${destination}
- Budget tier: ${budgetTier} — ${budgetGuidance(budgetTier)}
- Interests: ${interests && interests.length ? interests.join(', ') : 'general sightseeing'}
- Season: ${season || 'unspecified'}
- Day to regenerate: Day ${dayNumber}
- User request: "${feedback}"

Generate a NEW plan for Day ${dayNumber} only, honoring the user's request and keeping it realistic for the budget tier.

Output ONLY valid JSON in EXACTLY this shape (no markdown, no commentary):
{
  "dayNumber": ${dayNumber},
  "title": "Short theme for the day",
  "activities": [
    { "title": "Activity name", "description": "1-2 sentence detail", "estimatedCostUSD": 20, "timeOfDay": "Morning" }
  ]
}
"timeOfDay" must be one of: Morning, Afternoon, Evening.
`;

  return generateJSON(prompt);
}

module.exports = {
  generateTripPlan,
  regenerateDay,
  fetchWithRetry,
};
