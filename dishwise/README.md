# Dishwise

**Know what to order. Discover what you love.**

Dishwise helps people understand unfamiliar restaurant menus, get three personal picks
(Safe, Adventure, Value), enjoy the meal without their phone, and remember what they loved.

> Before: help me choose · During: help me enjoy · After: help me remember

This folder is a working, mobile-first prototype built to put in front of ~20 real
testers and learn whether the core problem is worth solving.

---

## Quick start (about 5 minutes)

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
cd dishwise
npm install
npm run dev
```

Open **http://localhost:3000** on your computer. To try it on your phone, make sure the
phone is on the same Wi-Fi network and open `http://<your-computer's-IP>:3000`.

Nothing else is required. With no keys configured you can:

- set preferences, try the **three sample menus** (fictional restaurants), or **paste any real menu's text**
- get Safe / Adventure / Value picks from Dishwise's built-in rules engine
- choose a dish → Enjoy the Moment → leave feedback → see your Journal and Passport
- open the Founder dashboard at **/founder** (no passcode needed locally)

### Turn on AI (photos, PDFs, richer explanations)

1. Create an API key at <https://console.anthropic.com/>.
2. Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY=...`.
3. Restart `npm run dev`. The Scan screen will now accept photos and PDFs, and picks
   will say "Explained by AI, checked by Dishwise's dietary rules".

The key stays on the server and is never sent to the browser. Cost is a few pence per
scan or less. `DISHWISE_AI_EFFORT=low` (the default) keeps it fast. Raise to `medium` if
you'd like more careful picks at the cost of speed.

### Run the tests

```bash
npm test                         # 21 unit tests: parser, dietary safety, recommender, AI merge, analytics
npm run build && FOUNDER_PASSCODE=test123 npm start   # in one terminal
BASE_URL=http://localhost:3000 FOUNDER_PASSCODE=test123 npm run test:e2e   # in another
```

The end-to-end test drives a real (headless) phone-sized browser through the full journey:
onboarding → scan → review → picks → details → enjoy → feedback → journal → passport →
founder dashboard. It needs [Playwright](https://playwright.dev) (`npm i -D playwright && npx playwright install chromium`)
if it isn't already on your machine.

---

## Deploying for your user test (Vercel)

1. Push this repository to GitHub, then **Import** it at <https://vercel.com/new>.
   Set the **Root Directory** to `dishwise`.
2. Add environment variables (Project → Settings → Environment Variables):
   - `FOUNDER_PASSCODE`: **required** to open `/founder` in production
   - `ANTHROPIC_API_KEY`: optional, enables photo/PDF reading
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: **strongly recommended** so test
     data survives (see below)
3. Deploy. Share links like `https://your-app.vercel.app/?invite=sam` so the dashboard can
   show who started from which invite.

### Keeping test data (Supabase, free tier is fine)

Without Supabase, analytics are written to a temporary file that Vercel wipes regularly,
and the dashboard will warn you about this.

1. Create a project at <https://supabase.com>.
2. In the SQL editor, run `supabase/migrations/0001_dishwise_events.sql`.
3. From Project Settings → API copy the **Project URL** → `SUPABASE_URL`, and the
   **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (secret; server only).

Row-level security is on with no public policies, so only the server can read or write
the events table.

---

## What's real, what's simulated

| Area | Status |
|---|---|
| Preferences (5 steps, all skippable) | ✅ Works, saved on the device |
| Paste menu text → dishes | ✅ Works with no AI (deterministic parser) |
| Photo / PDF → dishes | ✅ Works **with** an API key. Without one, the app says so honestly |
| Review & correct dishes | ✅ Works |
| Dish explanations | ✅ Built-in glossary of ~80 dishes/terms (labelled "General"). AI explanations when a key is set (labelled "AI") |
| Safe / Adventure / Value picks | ✅ Rules engine always runs. AI enriches when configured |
| Dietary & allergen safety layer | ✅ Deterministic. Removes clear conflicts, even ones the AI suggests; never claims "free from" or "halal" |
| Enjoy the Moment + conversation prompts | ✅ Works. No notifications, no phone locking |
| Post-meal feedback & validation questions | ✅ Works |
| Food Journal (notes, photos) | ✅ Works, on the device only |
| Share cards (Story / Square PNG) | ✅ Works. Download or the phone's share sheet, never auto-posted |
| Food Passport, milestones, personality, Wrapped | ✅ Works, from recorded meals only |
| Founder validation dashboard | ✅ Works (funnel, time-to-picks, confidence, stated vs actual return, WTP, comments) |
| Partner offers | 🟡 **Demonstration only**, clearly labelled. No real partners |
| Restaurant photos | 🟡 None exist yet, so a tasteful placeholder is shown. We never use AI or stock photos |
| Accounts, sync across devices | ⏳ Not built. Guest-first by design |
| Nutrition / calories | ⏳ Not shown. Fitness mode only leans on menu wording and says so |

---

## How it works (architecture in plain English)

```
Phone browser ──► Next.js app (one project, deploys to Vercel)
   │                 ├─ /api/extract    menu photo/PDF/text → dishes   (AI optional)
   │                 ├─ /api/recommend  dishes + preferences → 3 picks (rules + AI optional)
   │                 ├─ /api/events     anonymous usage events
   │                 └─ /api/founder    aggregated metrics (passcode)
   └─ localStorage: preferences, current menu, journal (never leaves the device)
```

- **Rules engine first, AI second.** `src/lib/recommend/rules.ts` scores dishes against
  preferences and is always the safety net. `src/lib/recommend/merge.ts` lets the AI
  improve explanations but throws away any AI pick that isn't on the menu or conflicts
  with a dietary requirement.
- **Every fact is labelled** with where it came from: *Menu*, *General* knowledge, *AI*
  interpretation, or *Unknown* (`src/lib/types.ts`).
- **Uploads are checked**: file type by its actual bytes (not the name), 5 MB image / 10 MB
  PDF limits, 20,000-character text limit, per-IP rate limits, and the AI is told to
  reject anything that isn't a menu and to ignore instructions hidden in menu text.

Key folders:

| Path | What's there |
|---|---|
| `src/app/` | Screens (one folder per route) and API routes |
| `src/components/` | Design system: buttons, cards, chips, source badges, icons |
| `src/lib/menu/` | Parser, glossary, dietary analysis, dish explanations |
| `src/lib/recommend/` | Rules engine and AI merge |
| `src/lib/ai/claude.ts` | The only file that talks to the AI service |
| `src/lib/analytics/` | Event schema, storage, metrics |
| `supabase/migrations/` | Database setup for analytics |

---

## Running the 20-person test

1. Deploy with Supabase + `FOUNDER_PASSCODE` (+ an API key if you want photo scanning).
2. Give each person a link with an invite code: `/?invite=name`.
3. Enter how many you invited at the top of `/founder`.
4. Ask them to use it **at a real restaurant**, then complete the 30-second review.
5. A week later, look at **"Actually came back"** vs **"said they would"**. That gap is
   the most honest signal you'll get from a test this size.

Questions the dashboard answers: Did they start? Upload a *real* menu (not just a
sample)? Get picks, and how fast? Choose a recommended dish? Feel more confident? What
would they have done otherwise? Would they pay? Did they return?

---

## Roadmap

**Prototype (this build)**: one excellent journey, guest-only, sample + real menus,
rules + optional AI, validation analytics.

**MVP (after validation)**
- Accounts (Supabase Auth) with optional sync of preferences & journal
- Restaurant-verified menus via QR code; real dish photos supplied by restaurants
- Faster scanning (streamed results), offline-friendly PWA install
- Fitness mode with verified nutrition where restaurants provide it
- Freemium experiment: limited free scans, premium Passport insights (no paywall until demand is proven)

**Platform (later)**
- Restaurant dashboard: manage menus, verified allergens/dietary info, photos, analytics, promotions
- Partner rewards & clearly-disclosed sponsored discovery (never disguised as personal picks)
- Discovery & booking via partner integrations (each needs separate commercial validation)
- Date-night & business dining modes, travel/hotel/airport/cruise menus, international expansion
- Annual Food Wrapped, social sharing formats, Dining Personality

---

## Trust & safety principles (non-negotiable)

- Only recommend dishes that are on the menu provided. Never invent dishes.
- Never invent prices, portions, calories, ratings or popularity.
- Unknown means unknown. Never claim allergen-free; never infer halal from a dish name.
- Always prompt diners to confirm dietary and allergen details with staff.
- No AI-generated or stock photos presented as a restaurant's food.
- Collect the minimum data needed; personal content stays on the device.
