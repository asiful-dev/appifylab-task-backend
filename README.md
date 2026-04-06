# BuddyScript Backend

Backend service for the BuddyScript social feed selection task (Appifylab), built with Express + TypeScript + Drizzle + Supabase.

## 1) Why this backend architecture

This backend follows a **layered, API-first architecture** to match the PRD goals: fast MVP delivery, production-ready security, and clean code organization.

- **Express 5 + TypeScript**: required by task scope, strong ecosystem, predictable request lifecycle, and reliable typing across route/controller/service layers.
- **Drizzle ORM + Postgres (Supabase)**: type-safe SQL with minimal abstraction overhead and straightforward migrations.
- **Supabase Storage**: managed object storage for avatars/post images without operating extra infra.
- **Zod validation**: strict runtime validation and safer API contracts.
- **JWT auth (access + refresh)**: short-lived access tokens with refresh flow and httpOnly cookies for better session security.
- **Swagger/OpenAPI**: machine-readable contract (`/api/spec`) for frontend integration and evaluator review.

## 2) Major technology choices and decisions

### Framework and runtime
- **Node.js + Express 5** for API routing, middleware composition, and simple horizontal scaling.
- **TypeScript (strict-ish backend typing)** to reduce runtime bugs in auth, DTOs, and service logic.

### Data and storage
- **Supabase Postgres** as managed DB (pooling + hosted reliability for MVP).
- **Drizzle schema-first migrations** (`drizzle/`) to keep schema changes explicit and versioned.
- **Supabase object storage** for media to avoid local filesystem persistence issues in cloud/serverless environments.

### Security and reliability
- **Helmet** for security headers.
- **CORS** locked to configured frontend origin (`CLIENT_URL`).
- **Rate limiting** on `/api` with stricter guards for auth-sensitive routes.
- **bcryptjs + JWT** for credential and token security primitives.

### API contract and developer experience
- **Swagger/OpenAPI docs** at `/api-docs`, JSON export at `/api-docs.json` and `/api/spec`.
- **Vercel bridge entry** in `api/index.ts` keeps cloud deployment adapter separate from app logic.

## 3) Backend architectural pattern

Request flow:

`Route -> Middleware (auth/validation/rate-limit) -> Controller -> Service -> Drizzle DB / Supabase Storage`

Design intent:
- Keep controllers thin (HTTP in/out only).
- Keep services as business logic boundary.
- Keep validators and shared types isolated for maintainability and testing.

## 4) Folder architecture

```text
backend/
├─ api/                      # Vercel function entrypoint
├─ src/
│  ├─ app.ts                # Express app wiring + middleware + docs routes
│  ├─ index.ts              # Local runtime server bootstrap
│  ├─ config/               # env, database, swagger config
│  ├─ controllers/          # request/response orchestration
│  ├─ services/             # business logic + DB/storage operations
│  ├─ routes/               # endpoint registration
│  ├─ middleware/           # auth, validation, logging, error handling, rate limiting
│  ├─ validators/           # Zod request schemas
│  ├─ types/                # feature-specific TS contracts
│  ├─ db/schema/            # Drizzle schema definitions
│  └─ utils/                # shared utility functions
├─ drizzle/                 # SQL migration outputs + snapshots
├─ tests/integration/       # route-level integration tests
├─ uploads/                 # local dev upload temp dir (cloud should use Supabase Storage)
├─ dockerfile
├─ docker-compose.yml
└─ vercel.json
```

## 5) Local setup and run guide

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase project (DB + Storage)

### Step 1: install dependencies
```bash
cd backend
npm install
```

### Step 2: configure environment
```bash
cp .env.sample .env
```

Set required values in `.env`:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLIENT_URL` (frontend URL, e.g. `http://localhost:3000`)

### Step 3: generate/apply migrations
```bash
npm run db:generate
npm run db:migrate
```

### Step 4: run backend
```bash
npm run server
```

Server endpoints (local):
- API base: `http://localhost:5000/api`
- Health: `http://localhost:5000/health`
- Swagger UI: `http://localhost:5000/api-docs`
- OpenAPI JSON: `http://localhost:5000/api/spec`

## 6) Useful scripts

- `npm run server` — dev server with watch mode
- `npm run build` — compile TypeScript to `dist/`
- `npm run start` — run compiled server
- `npm run test` — integration/unit test suite via Vitest
- `npm run lint` — lint source files
- `npm run type-check` — TypeScript no-emit check
- `npm run db:generate` / `npm run db:migrate` / `npm run db:push` — Drizzle workflows

## 7) Deployment and live endpoints

Current deployment style in repo is **Vercel-friendly backend packaging** (`api/index.ts` + `vercel.json`), while PRD also discusses hybrid deployment options.

Live backend base URL (from project config):
- `https://appifylab-task-backend-pi.vercel.app`

Live docs/spec:
- `https://appifylab-task-backend-pi.vercel.app/api-docs`
- `https://appifylab-task-backend-pi.vercel.app/api/spec`

## 8) Integration notes for frontend

- API root expected by frontend: `/api`
- Response envelope convention:
  - success: `{ success: true, data, meta? }`
  - error: `{ success: false, error: { code, message } }`
- Auth model:
  - access token in response body
  - refresh token via httpOnly cookie

## 9) Troubleshooting quick checks

- **Env validation failure on boot**: confirm all required vars exist in `.env`.
- **CORS issues**: ensure backend `CLIENT_URL` matches active frontend origin exactly.
- **Image upload failures**: verify Supabase keys and storage bucket permissions.
- **401 loops on frontend**: check refresh cookie domain/same-site settings and frontend credentials mode.

---

If you are evaluating this as part of the Appifylab selection task, start with:
1) `/api-docs` for endpoint coverage, and
2) integration tests in `tests/integration/` for behavior checks.
