# ✈️ Trao — AI Travel Planner

A secure, multi-user web app that generates complete, **editable** travel itineraries with an
LLM agent. Users enter a destination, duration, budget, and interests; Trao produces a
day-by-day plan, a realistic budget breakdown, hotel suggestions, and a **weather-aware
packing checklist** — all saved per user with strict data isolation.

---

## 1. Project Overview

| Capability | Status |
| --- | --- |
| User registration & login (JWT) | ✅ |
| Per-user data isolation | ✅ (every query scoped by `userId`) |
| Trip input form (destination, days, budget, interests) | ✅ |
| AI day-by-day itinerary generation | ✅ |
| Budget estimation (flights, transport, lodging, food, activities) | ✅ |
| Editable itinerary — add / remove activity, regenerate a day | ✅ |
| Hotel suggestions (bonus) | ✅ |
| **Creative feature: Weather-Aware Packing Assistant** | ✅ |
| Responsive, accessible UI | ✅ |
| Graceful error handling + AI retry/backoff | ✅ |

---

## 2. Tech Stack & Justification

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | **Next.js 14 (App Router) + TypeScript + Tailwind CSS** | Matches the preferred stack. App Router gives clean file-based routing; TypeScript enforces a shared data contract with the API; Tailwind keeps styling co-located and responsive. |
| Backend | **Node.js + Express (JavaScript)** | Lightweight, well-understood REST layer with clear separation into routes → controllers → services. |
| Database | **MongoDB + Mongoose** | Trips are naturally document-shaped (nested itinerary days, activities, packing items). Mongoose adds schema validation and relationships. |
| Auth | **JWT + bcryptjs** | Stateless auth that works cleanly across separately deployed frontend/backend. Passwords are hashed; tokens carry only the user id. |
| AI | **Google Gemini (`gemini-2.5-flash`)** | Free tier via Google AI Studio, fast, and supports a JSON response MIME type so the model returns data conforming exactly to our schema. |

> The AI provider is isolated in `backend/services/geminiService.js`. Swapping providers only
> touches that one file.

---

## 3. Architecture

```
┌──────────────────────────────┐         ┌───────────────────────────────┐
│   Next.js Client (Vercel)    │         │   Express API (Render/Railway) │
│  AuthContext · api.ts client │  HTTPS  │  Auth MW → Routes → Controllers│
│  Dashboard / Forms / Cards   │ ──────► │           │            │       │
│  JWT stored in localStorage  │  Bearer │           ▼            ▼       │
└──────────────────────────────┘  token  │   geminiService     Mongoose  │
                                          └────────┬───────────────┬──────┘
                                                   ▼               ▼
                                           Google Gemini API   MongoDB Atlas
                                            (LLM JSON gen)    (Users · Trips)
```

**Request flow:** Client attaches `Authorization: Bearer <JWT>` → `auth` middleware verifies the
token and sets `req.user.id` → controller runs a query **scoped to that id** → for AI routes the
controller delegates to the Gemini service (with retry/backoff) → result is persisted and returned.

**Separation of concerns (backend):**
```
routes/        # HTTP bindings only
controllers/   # request/response + validation + orchestration
services/      # Gemini integration (prompts, retry, JSON parsing)
models/        # Mongoose schemas + password hashing
middleware/    # JWT verification
config/        # DB connection
utils/         # token signing
```

---

## 4. Authentication & Authorization Approach

- **Registration** hashes the password with `bcryptjs` (salt rounds = 10) inside a Mongoose
  `pre('save')` hook, so plaintext is never persisted. A JWT is signed with `{ id }`.
- **Login** loads the user with `.select('+password')` (the hash is `select:false` by default),
  compares with `bcrypt.compare`, and returns a fresh JWT.
- **Authorization** — every protected route passes through `middleware/auth.js`, which verifies the
  token and attaches `req.user`. All trip routes are mounted behind it (`router.use(auth)`).
- **Data isolation** — there is **no** code path that reads or writes a trip without
  `userId: req.user.id` in the query. Supplying another user's trip id simply returns `404`,
  because the compound filter matches nothing. This is the single most important security property
  of the app and is enforced uniformly in `tripController.js`.
- Auth failures return `401`; the client clears the token and redirects to `/login`.

---

## 5. AI Agent Design & Purpose

The agent (`services/geminiService.js`) is prompted to act as an expert travel planner and is
constrained to return **JSON matching the database schema** via `responseMimeType: "application/json"`.

Two operations:
1. **`generateTripPlan`** — one call returns the full itinerary, hotels, budget, and packing list.
   The prompt injects budget-tier guidance (backpacker vs. luxury) so estimates are realistic.
2. **`regenerateDay`** — takes natural-language feedback (e.g. *"Make Day 3 outdoor hiking instead
   of shopping"*) plus the existing trip context and rebuilds only that day.

**Resilience:** `fetchWithRetry` retries transient failures (HTTP 429 / 5xx / network) up to 5 times
with exponential backoff — 1s, 2s, 4s, 8s, 16s — shielding the app from rate limits. AI failures
surface to the client as a clean `502` with a friendly message, never a stack trace.

---

## 6. Creative Feature — Weather-Aware Packing Assistant

**What it is:** An interactive, persisted packing checklist generated alongside each itinerary,
grouped into *Crucial Travel Documents*, *Climate Wear*, and *Activity-Specific Gear*. Each item
carries a short **reason**, and checking/unchecking persists to the database.

**Why I built it & the problem it solves:** Travelers routinely over- or under-pack because they
reason about climate and activities separately. Trao already knows both — the destination's seasonal
climate **and** the exact activities planned (a hike, a beach day, a temple visit). The agent
cross-references the two to produce a checklist that's specific to *this* trip (e.g. "hiking boots"
only appears when a hike is on the itinerary; "high-SPF sunscreen" appears for sunny coastal days).
It turns data the app already has into a genuinely useful, actionable artifact — demonstrating
engineering judgment (reuse existing context) over bolting on an unrelated feature.

---

## 7. API Reference

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Create account, return JWT |
| POST | `/api/auth/login` | — | Log in, return JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/trips` | ✅ | List the user's trips |
| POST | `/api/trips` | ✅ | Generate & save a new trip |
| GET | `/api/trips/:id` | ✅ | Get one owned trip |
| PUT | `/api/trips/:id` | ✅ | Update itinerary / hotels / packing |
| DELETE | `/api/trips/:id` | ✅ | Delete an owned trip |
| POST | `/api/trips/:id/days/:dayNumber/regenerate` | ✅ | Regenerate a single day from feedback |

---

## 8. Setup — Local

### Prerequisites
- Node.js 18+ , a free **MongoDB Atlas** cluster, and a free **Gemini API key**
  (https://aistudio.google.com/app/apikey).

### Backend
```bash
cd backend
npm install
cp .env.example .env        # then fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev                 # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev                        # http://localhost:3000
```

Open http://localhost:3000, register, and generate a trip.

---

## 9. Deployment

**Backend (Render or Railway):**
1. Push the repo to GitHub (`.env` is git-ignored).
2. Create a Web Service from the `backend/` folder. Build: `npm install`. Start: `npm start`.
3. Set env vars: `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and
   `CLIENT_URL=https://<your-vercel-domain>` (for CORS).

**Frontend (Vercel):**
1. Import the repo, set the project root to `frontend/`.
2. Add env var `NEXT_PUBLIC_API_URL=https://<your-backend-domain>`.
3. Deploy.

Update the backend's `CLIENT_URL` to the final Vercel domain so CORS allows the browser origin.

---

## 10. Key Design Decisions & Trade-offs

- **JWT in `localStorage`** — simplest cross-origin auth for a split frontend/backend deploy.
  Trade-off: not as XSS-hardened as httpOnly cookies; acceptable for this scope and easy to swap.
- **Single AI call for the whole plan** — fewer round trips and a cheaper, faster UX vs. generating
  each section separately. Trade-off: a larger prompt and one bigger JSON to validate.
- **Client-driven edits via a generic `PUT`** — add/remove activity and packing toggles send the
  updated sub-document. Simple and flexible; trade-off is slightly more data on the wire than
  surgical patch endpoints (regeneration, which needs the LLM, has its own endpoint).
- **Budget total recomputed server-side** — `withConsistentTotal` ensures the total always equals
  the sum of its parts, regardless of what the model or client sends.
- **AI provider isolated in a service** — keeps controllers vendor-agnostic and swappable.

---

## 11. Known Limitations

- AI estimates (prices, hotels) are model-generated approximations, not live data.
- No automated test suite yet (manual test checklist below); validation is basic.
- `localStorage` token has no silent refresh — users re-login after expiry (default 7 days).
- Itinerary edits are last-write-wins (no optimistic concurrency control).

---

## 12. Manual Test Checklist

| Test | Procedure | Expected |
| --- | --- | --- |
| Auth required | `GET /api/trips` with no header | `401` |
| Data isolation | User A creates a trip; log in as User B | B sees an empty list; B cannot fetch A's trip id (`404`) |
| AI resilience | Use an invalid Gemini key | Backoff logs (1s,2s,4s…) then a clean `502` |
| Responsiveness | Shrink the viewport | 3-column grid collapses to single column |

---

## 13. Submission Checklist (for the candidate)

- [ ] Push to a **public GitHub repo** with meaningful commit history.
- [ ] Deploy backend + frontend; paste both public URLs here.
- [ ] Record a **3–4 min walkthrough** (flow, auth/authorization, AI, creative feature, design
      decisions) and add the link here.
- [x] README (this file).
```
Deployed frontend: <add your Vercel URL>
Deployed backend:  <add your Render/Railway URL>
Walkthrough video: <add your video link>
```
