# Eco EFI Check

**AI-assisted vehicle engine health and emission analysis from tailpipe gas-analyser readings.**

Live app: <https://eco-efi-check.lovable.app>

Eco EFI Check is the reference web implementation of a research project on data-driven
engine-condition assessment. It takes the twelve emission-test parameters produced by a
standard exhaust gas analyser (idle and acceleration modes), runs them through a
Random-Forest regression model trained during the research, and returns an
**EFI (Engine Fuel-Injection) Score** on a 1–100 scale together with a population
percentile, a rule-based diagnostic breakdown, an LLM-generated maintenance report and a
downloadable PDF.

---

## Table of contents

1. [Motivation](#motivation)
2. [Features](#features)
3. [System architecture](#system-architecture)
4. [Technology stack](#technology-stack)
5. [Input parameters](#input-parameters)
6. [Scoring and interpretation](#scoring-and-interpretation)
7. [Diagnostic rule engine](#diagnostic-rule-engine)
8. [AI insight layer](#ai-insight-layer)
9. [Data model](#data-model)
10. [Getting started](#getting-started)
11. [Configuration](#configuration)
12. [Project structure](#project-structure)
13. [Security](#security)
14. [Limitations](#limitations)
15. [Citing this work](#citing-this-work)
16. [License](#license)

---

## Motivation

Emission-test reports issued at inspection centres are pass/fail documents: they tell a
vehicle owner whether the car is legal, not how healthy the engine is or what to do about
it. The research behind this application asks whether the same raw gas-analyser readings
can be used to (a) produce a continuous engine-health score, (b) place a vehicle relative
to a reference population and (c) be translated into non-technical, actionable guidance.

Eco EFI Check operationalises that pipeline end-to-end so the model can be evaluated with
real users rather than only on a held-out test set.

## Features

- **Emission data entry** — validated form for the 12 idle/acceleration parameters plus
  optional vehicle metadata (make, model, year, fuel system: Carbureted or EFI).
- **EFI score prediction** — server-side inference with the trained Random-Forest model.
- **Population percentile** — the score is ranked against a reference distribution of
  previously analysed vehicles.
- **CO emission percentile** — average carbon-monoxide output ranked against a separate
  CO reference distribution, with an environmental-impact reading.
- **Rule-based diagnostics** — four deterministic indicators (mixture state, combustion
  quality, fuel-burn efficiency, oxygen balance) derived directly from the readings.
- **AI diagnostic insight** — an LLM converts the score, percentiles and diagnostic flags
  into a plain-language summary, likely causes, recommended actions, maintenance tips and
  an environmental summary.
- **History** — per-user record of past analyses with pagination and soft delete.
- **PDF report** — client-side export containing every element shown on the results page.
- **Google sign-in** — authenticated, per-user data isolation enforced at the database
  level.

## System architecture

```text
┌──────────────────────────── Client (browser) ─────────────────────────────┐
│  React 18 + Vite + TypeScript + Tailwind (shadcn/ui)                      │
│                                                                           │
│  /            Landing page                                                │
│  /auth        Google OAuth sign-in                                        │
│  /analyze     Emission input form  ──┐                                    │
│  /results     Score, percentiles, diagnostics, AI insight, PDF export     │
│  /history     Past analyses (paginated, soft delete)                      │
└──────────────────────────────────────┼────────────────────────────────────┘
                                       │ HTTPS + JWT (Bearer)
                                       ▼
┌───────────────────── Backend (Supabase / Lovable Cloud) ──────────────────┐
│                                                                           │
│  Edge Function: predict_efi  (Deno / TypeScript)                          │
│    1. Verify JWT, authorise caller                                        │
│    2. Validate the 12 numeric features and fuel_system                    │
│    3. Load reference distributions from Object Storage (cached per        │
│       cold start)                                                         │
│    4. Random-Forest inference (tree traversal over the exported model)     │
│    5. Percentile computation (EFI score + average CO)                     │
│    6. Rule engine -> 4 diagnostic flags                                   │
│    7. LLM call -> structured JSON insight (graceful degradation)           │
│    8. Return { efi_score, percentile, condition, diagnostic_flags,        │
│                ai_insight, co_percentile, co_average }                    │
│                                                                           │
│  Auth        Google OAuth provider, JWT issuance                          │
│  Postgres    public.efi_records (row-level security, soft delete)         │
│  Storage     efi-distribution/efi_distribution.json                       │
│              efi-distribution/co_distribution.json                        │
└───────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                        External LLM provider (chat completions)
```

A Mermaid version of this diagram is maintained alongside the research documentation.

### Request flow

1. The user submits emission readings on `/analyze`.
2. The client invokes the `predict_efi` Edge Function with the user's access token.
3. The function validates input, predicts the EFI score, computes both percentiles and the
   diagnostic flags, then requests the AI insight.
4. The client persists the result to `efi_records` and renders `/results`.
5. The user can export a PDF or revisit the analysis from `/history`.

## Technology stack

| Layer | Technology |
| --- | --- |
| UI | React 18, TypeScript, Vite 5, Tailwind CSS 3, shadcn/ui, Radix UI, lucide-react |
| State / data | TanStack Query, React Hook Form, Zod |
| Charts & reports | Recharts, jsPDF |
| Routing | React Router 6 |
| Backend runtime | Supabase Edge Functions (Deno) |
| Database | PostgreSQL with row-level security |
| Object storage | Supabase Storage (reference distributions) |
| Auth | Supabase Auth, Google OAuth |
| ML inference | Random-Forest regressor exported to JSON, traversed in TypeScript |
| Generative AI | OpenAI-compatible chat-completions endpoint, JSON-mode output |

## Input parameters

Two measurement modes, six parameters each:

| Parameter | Idle key | Acceleration key | Unit |
| --- | --- | --- | --- |
| Hydrocarbons | `idle_hc` | `acc_hc` | ppm |
| Carbon monoxide | `idle_co` | `acc_co` | % vol |
| Carbon dioxide | `idle_co2` | `acc_co2` | % vol |
| Oxygen | `idle_o2` | `acc_o2` | % vol |
| Lambda | `idle_lambda` | `acc_lambda` | ratio |
| Engine speed | `idle_rpm` | `acc_rpm` | rpm |

All twelve values must be finite numbers in the range `0 … 10000`; the Edge Function
rejects anything outside those bounds. `fuel_system`, when supplied, must be
`Carbureted` or `EFI`.

## Scoring and interpretation

The model output is clamped and rounded to an integer in `[1, 100]`. Condition bands:

| EFI score | Condition |
| --- | --- |
| 73 – 100 | Good |
| 50 – 72 | Moderate |
| 1 – 49 | Poor |

Percentiles use the empirical cumulative distribution of the reference dataset:

```text
percentile = round( count(reference_values <= value) / count(reference_values) * 100 )
```

applied to the EFI score (higher is better) and to average CO,
`co_average = (acc_co + idle_co) / 2` (a higher CO percentile means the vehicle emits more
carbon monoxide than that share of the reference population).

## Diagnostic rule engine

Deterministic indicators computed from the mean of the idle and acceleration readings.
They are shown to the user and are the only engine-state facts passed to the LLM, which
keeps the generated text grounded.

| Indicator | Condition | Label |
| --- | --- | --- |
| Mixture state (mean lambda) | `< 1.00` / `1.00–1.12` / `> 1.12` | Rich / Balanced / Lean |
| Combustion quality (mean HC) | `< 75` / `75–170` / `> 170` | Efficient / Moderate / Incomplete combustion |
| Fuel-burn efficiency (mean CO) | `< 0.2` / `0.2–0.55` / `> 0.55` | Clean / Moderate / Excess fuel |
| Oxygen balance (mean O₂) | `< 2` / `2–4` / `> 4` | Normal / Elevated / Excess oxygen |

## AI insight layer

The LLM receives only derived values — EFI score, EFI percentile, condition band, engine
type, the four diagnostic flags and the CO percentile — never free text from the user. It
must return JSON with exactly these keys:

`summary`, `likely_causes`, `recommended_actions`, `maintenance_tips`,
`environmental_summary`

The prompt forbids inventing faults that the flags do not support, forbids quantitative
claims about fuel economy or carbon footprint, and pins the direction of the CO percentile
interpretation. Malformed output is repaired and re-parsed; if the provider is unavailable
the response carries `ai_error` and the rest of the analysis is still displayed.

## Data model

`public.efi_records`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | primary key |
| `user_id` | `uuid` | owner, references the auth user |
| `input` | `jsonb` | the 12 readings plus vehicle metadata |
| `efi_score` | `integer` | 0–100, check-constrained |
| `percentile` | `integer` | EFI percentile |
| `condition` | `text` | Good / Moderate / Poor |
| `diagnostic_flags` | `jsonb` | rule-engine output |
| `ai_insight` | `jsonb` | LLM report |
| `co_percentile` | `integer` | CO percentile |
| `co_average` | `numeric` | mean CO (% vol) |
| `is_deleted` | `boolean` | soft delete, default `false` |
| `created_at` | `timestamptz` | default `now()` |

Row-level security restricts every operation to `auth.uid() = user_id`; deletion is a soft
delete so historical analyses remain available for research aggregation while disappearing
from the user's history view.

## Getting started

Requirements: Node.js 18+ (or Bun) and a Supabase project.

```sh
git clone <repository-url>
cd <repository-directory>
npm install
npm run dev          # http://localhost:8080
```

Scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | start the Vite dev server |
| `npm run build` | production build to `dist/` |
| `npm run build:dev` | development-mode build |
| `npm run preview` | serve the production build locally |
| `npm run lint` | ESLint over the project |

### Backend setup

1. Apply the SQL migrations in `supabase/migrations/` to your project.
2. Create a storage bucket named `efi-distribution` and upload
   `efi_distribution.json` and `co_distribution.json` (JSON arrays, or objects with
   numeric values, of reference scores).
3. Enable the Google auth provider and add your app origin to the allowed redirect URLs.
4. Deploy the Edge Function in `supabase/functions/predict_efi/`.

## Configuration

Client environment variables (`.env`):

```sh
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

Edge Function secrets:

| Name | Purpose |
| --- | --- |
| `SUPABASE_URL` | injected by the platform |
| `SUPABASE_ANON_KEY` | injected; used to verify the caller's JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | injected; reads the reference distributions from storage |
| `GPT_API_KEY` | API key for the chat-completions provider |

Never commit secrets; the publishable/anon key is the only key intended for the client.

## Project structure

```text
public/                       static assets, social preview image
src/
  components/
    AIInsightCard.tsx         LLM report rendering
    COEmissionCard.tsx        CO percentile visualisation
    DistributionBar.tsx       EFI population distribution
    EFIGauge.tsx              score gauge
    EcoTipCard.tsx            highlighted environmental-impact section
    EmissionInput.tsx         validated numeric field
    HeroBackground.tsx        landing visual
    ui/                       shadcn/ui primitives
  hooks/useAuth.tsx           session context
  integrations/supabase/      generated client and types
  pages/
    Index.tsx                 landing
    Auth.tsx                  Google sign-in
    Analyze.tsx               emission input, prediction call, persistence
    Results.tsx               results dashboard and PDF export
    History.tsx               paginated past analyses
supabase/
  functions/predict_efi/      Edge Function + exported Random-Forest model
  migrations/                 database schema evolution
```

## Security

- All analysis requests require a valid JWT; the Edge Function verifies claims before
  doing any work.
- Row-level security isolates records per user; no cross-user reads are possible.
- Input is range- and type-validated server-side; internal errors are never surfaced
  verbatim to clients.
- The LLM never receives user-authored free text, which removes the prompt-injection
  surface from the diagnostic path.

## Limitations

- The reference distributions and the trained model reflect the vehicle population
  sampled during the research; percentiles are not globally representative.
- The EFI score is a research indicator, not a regulatory or roadworthiness verdict.
- Generated maintenance guidance is advisory and must not replace inspection by a
  qualified technician.
- Readings are entered manually, so results inherit any measurement or transcription
  error from the source emission report.

## Citing this work

If you use this application or its methodology, please cite the associated research
publication. Add the bibliographic entry here once the paper is published.

## License

Released for academic and research use. Add a formal license file before external
distribution.
