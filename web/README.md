# B2Wall Web — Frontend-only demo

Two-sided capital marketplace UI. Design-first, trust-first, low-ambiguity. **No database, no API, no auth server.** All data from mocks and in-memory store with localStorage persistence.

## Stack

- Next.js 14 (App Router) + TypeScript
- TailwindCSS
- Mock data layer + in-memory store (localStorage for demo persistence)
- Demo auth (role switcher: investor / seeker / admin)

## Setup

1. **Install dependencies**

   ```bash
   cd web
   npm install
   ```

2. **Run** (no `.env` required)

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Demo mode

- **Banner:** A “حالت دمو” (Demo Mode) banner appears at the top. Use it to switch role (سرمایه‌گذار / پروژه‌ساز / ادمین) or log out.
- **Login:** `/login` — three buttons: ورود به عنوان سرمایه‌گذار / پروژه‌ساز / ادمین. No password; role is stored in localStorage.
- **Data:** Projects and fundings are loaded from `mocks/` and persisted in localStorage when you invest or create a project. Refresh keeps your demo data.

## Routes

**Public:** `/`, `/projects`, `/projects/[id]`, `/reports`, `/login`

**Investor (demo role):** `/investor/onboarding`, `/investor/dashboard`, `/invest/[projectId]` (amount → confirm → receipt)

**Seeker (demo role):** `/seeker/new` (wizard), `/seeker/dashboard`

**Admin (demo role):** `/admin/projects`, `/admin/projects/[id]` (review/approve, change status)

Route protection is client-side via `<RoleGate>`; redirects to `/login` if role is not allowed.

## Docs

See `/docs` in repo root:

- `IA.md` — Information architecture
- `PROJECT-CARD-SCHEMA.md` — Card fields and layout contract
- `SCREEN-DECISIONS.md` — Dominant problem and REMOVE/ADD/REORDER per screen
- `METRIC-DEFINITIONS.md` — Metric definitions and context
- `RISK-TIER-RUBRIC.md` — Risk A/B/C rules
- `FUNDING-PROBABILITY-RUBRIC.md` — Funding probability scoring

## Design rules

- One dominant action on landing: "مشاهده فرصت‌های سرمایه‌گذاری"
- Project cards: guarantee dominant, risk tier, return, duration, progress, min allocation, purpose (max 90 chars)
- Numbers: Persian digits; context for every percentage (sample size, time window)
- No decorative sections; no extra CTAs on landing
