# 📦 Submission — Trao AI Travel Planner

Copy-paste this into the submission form. Fill the three links once deployed/recorded.

---

## 1. GitHub Repository
**https://github.com/Satyasai85/ai-travel-planner**
(Public. Commit history shows the development process.)

## 2. Deployment Links
- **Frontend (Vercel):** `<paste your Vercel URL here>`
- **Backend (Render):** `<paste your Render URL here>` — health check: `<backend-url>/api/health`

## 3. Walkthrough Video
- **Video link:** `<paste your video link here>` (Loom / Google Drive / YouTube unlisted)

## 4. README
Included in the repo: `README.md` (covers overview, tech stack, setup, architecture, auth, AI agent, creative feature, design decisions, limitations).

---

## One-paragraph summary (if a description box is asked)
Trao is a secure, multi-user AI travel planner. A user signs up, enters a destination, duration,
budget tier, and interests, and an AI agent (Google Gemini) generates a complete day-by-day
itinerary, a budget breakdown, hotel suggestions, and a **weather-aware packing checklist**. Trips
are editable (add/remove activities, regenerate any day from plain-English feedback) and saved
per user with strict data isolation. Built with Next.js (frontend), Express + MongoDB (backend),
and JWT auth.

---

## ✅ Before you submit — quick checklist
- [ ] Backend deployed on Render; open `<backend-url>/api/health` → returns `{"status":"healthy"}`
- [ ] Frontend deployed on Vercel; open it and **register a fresh account** to confirm it works end-to-end
- [ ] Backend env var `CLIENT_URL` set to your Vercel URL (so CORS allows the browser)
- [ ] Frontend env var `NEXT_PUBLIC_API_URL` set to your Render URL
- [ ] Generated at least one trip on the live site (proves frontend + backend + AI all reachable)
- [ ] Video recorded (3–4 min) and link set to "anyone with the link can view"
- [ ] All three links pasted above and into the submission form

---

## Deploy in ~10 minutes (if not done yet)

**Backend → Render**
1. Go to render.com → New + → **Blueprint** → connect repo `Satyasai85/ai-travel-planner`.
   (Render reads `render.yaml` automatically.)
2. When prompted, set these secrets:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `GEMINI_API_KEY` = your key from https://aistudio.google.com/app/apikey
   - `CLIENT_URL` = leave blank for now (set after frontend deploy)
3. Deploy. Copy the backend URL.

**Frontend → Vercel**
1. Go to vercel.com → New Project → import the repo.
2. Set **Root Directory = `frontend`**.
3. Add env var `NEXT_PUBLIC_API_URL` = your Render backend URL.
4. Deploy. Copy the Vercel URL.

**Finish**
1. Back in Render → backend service → Environment → set `CLIENT_URL` = your Vercel URL → save (it redeploys).
2. Open the Vercel URL, register, generate a trip. Done.
