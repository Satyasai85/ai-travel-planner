# 🎥 Video Walkthrough Script — Trao AI Travel Planner (3–4 min)

**How to use this:** Read the *spoken* lines aloud. Wherever you see **🖥️ SHOW →**, do that action
on screen / open that page *before* you read the line under it. Speak slowly and clearly — clarity
matters more than polish. Total target: ~3.5 minutes.

**Before you hit record:**
- Open your **deployed Vercel URL** (the live site), logged OUT, on the home/login page.
- Have a second browser tab with the **GitHub repo** ready.
- Have a third tab with the **README.md** ready (to glance at architecture if you want).
- Pick a demo trip in your head, e.g. **Tokyo, 3 days, Medium budget, interests: Food + Culture, season: Spring.**

---

## ⏱️ 0:00 – 0:25 — Intro & overview
**🖥️ SHOW →** the live deployed site (login/landing page).

> "Hi, this is my submission — **Trao**, an AI travel planner. It's a secure, multi-user web app
> where you enter a destination, how many days, your budget, and your interests, and an AI agent
> builds a full day-by-day itinerary, a budget breakdown, hotel suggestions, and a weather-aware
> packing list. Everything is saved per user. Let me walk through it."

---

## ⏱️ 0:25 – 1:00 — Authentication & authorization
**🖥️ SHOW →** Click **Register**, create a new account live (e.g. name, a test email, password).

> "First, authentication. I'll register a new account. Passwords are hashed with **bcrypt** on the
> server and never stored in plain text. On success the backend returns a **JWT**, which the
> frontend stores and sends on every request."

**🖥️ SHOW →** You land on the empty dashboard ("Create a new trip…").

> "For **authorization**, every trip route is protected by JWT middleware, and — this is the key
> part — every database query is scoped to the logged-in user's ID. So one user can never see or
> touch another user's trips. I'll show that data isolation at the end."

---

## ⏱️ 1:00 – 2:00 — AI agent functionality (the core)
**🖥️ SHOW →** Fill the **Create Trip** form: Destination *Tokyo*, Duration *3*, Budget *Medium*,
interests *Food, Culture*, season *Spring*. Click **Generate**.

> "Now the AI agent. I'll plan a 3-day trip to Tokyo, medium budget, focused on food and culture.
> When I generate, the backend sends a structured prompt to **Google Gemini** and asks it to return
> JSON that matches our exact data schema — itinerary, hotels, budget, and packing list — in a
> single call."

**🖥️ SHOW →** The itinerary appears. Scroll through the days and activities.

> "Here's the result: each day has a theme and a few activities with time of day and estimated
> cost. On the left, the AI also produced a realistic **budget breakdown** — flights, transport,
> accommodation, food, activities — and the total is recomputed on the server so it's always
> consistent."

**🖥️ SHOW →** Find a day, type feedback like *"make this day outdoor and relaxing"* and click
**Regenerate day**.

> "The agent is also interactive. I can give plain-English feedback on any single day — like
> 'make this day more outdoor and relaxing' — and it regenerates just that day while keeping the
> rest of the trip intact. The AI calls also have automatic retry with backoff, so temporary rate
> limits don't break the experience."

---

## ⏱️ 2:00 – 2:45 — Custom / creative feature
**🖥️ SHOW →** Scroll down to the **⛈️ AI Weather-Aware Packing Assistant** section.

> "This is my creative feature: a **weather-aware packing assistant**. Most apps give a generic
> packing list. This one cross-references two things the app already knows — the destination's
> **climate for that season**, and the **actual activities** planned in the itinerary."

**🖥️ SHOW →** Point at a couple of items and their "reason" text. Check/uncheck a box.

> "So every item comes with a reason — for example a light jacket because it's spring in Tokyo, or
> specific gear tied to an activity on the trip. It's grouped by documents, clothing, and gear, and
> I can tick items off — that state saves to the database. It turns data the app already has into
> something genuinely useful instead of a generic checklist."

---

## ⏱️ 2:45 – 3:20 — High-level design decisions
**🖥️ SHOW →** Switch to the **GitHub repo** tab; show the folder structure (backend/ and frontend/).
Optionally open `backend/services/geminiService.js`.

> "On design: the frontend is **Next.js with TypeScript**, the backend is **Express with MongoDB**,
> deployed separately. I chose **JWT auth** because it's stateless and works cleanly across a split
> frontend and backend. The backend is layered — routes, controllers, services, models — and all
> the AI logic is isolated in **one service file**, so swapping the AI provider would only touch
> that file. MongoDB fits because a trip is naturally a nested document: days, activities, packing
> items."

---

## ⏱️ 3:20 – 3:45 — Data isolation proof + close
**🖥️ SHOW →** (Optional but strong) Click **Sign out**, register/login as a *second* account, and
show the dashboard is empty — no trips from the first user.

> "And here's the authorization guarantee in action: I'll sign out and log in as a different user —
> the dashboard is completely empty. No user can ever see another user's data. That's Trao — secure
> multi-user auth, an interactive AI planning agent, and a weather-aware packing assistant. Thanks
> for watching."

**🖥️ STOP RECORDING.**

---

## 📌 Quick tips
- If generation is slow, talk through the budget panel or README while you wait.
- Don't show your real password clearly — use a throwaway test account.
- If you go over 4 min, cut the data-isolation proof (you already explained it at 1:00).
- Keep the live site (not localhost) on screen — graders want to see the deployed app working.
