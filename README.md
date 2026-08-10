# CareerAI — AI Resume Builder & Document Summarizer

**Create. Improve. Understand.**

CareerAI is a full-stack, production-oriented SaaS application with two AI-powered tools:

1. **AI Resume Builder** — a multi-step editor with a live preview, five ATS-friendly templates, AI writing assistance, an ATS analysis estimate, job-description matching, and server-side PDF export.
2. **AI Document Summarizer** — upload a PDF/DOCX/TXT (or paste text), get executive summaries, key points, and important details, then chat with the document using source-grounded retrieval.

> The app ships with a **deterministic development AI provider** (`AI_PROVIDER=mock`) so every feature works end-to-end with **no API keys**. The document features are extractive and grounded (they never invent facts); resume features rephrase your own input without fabricating achievements. Swap in OpenAI, Anthropic, or Gemini by setting environment variables — the provider abstraction requires no code changes.

---

## Features

- **Auth**: email/password (Auth.js / NextAuth v5), optional Google OAuth, protected dashboard routes, JWT sessions.
- **Resume Builder**: personal info, summary, experience, education, skills, projects, certifications, languages, achievements; per-section AI actions; real-time preview that is byte-identical to the exported PDF.
- **ATS Analysis & Job Matching**: AI-estimated compatibility score with category breakdown; matching/missing keyword analysis.
- **Document Summarizer**: drag-and-drop upload with validation and progress, text extraction, chunked hierarchical summarization for large docs, and a grounded chat assistant.
- **Usage & Plans**: per-plan limits (Free/Pro/Business) enforced server-side; usage dashboard; pricing page.
- **Security**: server-side ownership checks (you can never access another user's data by changing an ID), Zod validation on every request, secure file storage, no secrets exposed to the client.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn-style UI, Lucide icons, React Hook Form, Zod, Framer Motion.
- **Backend**: Next.js Route Handlers, Prisma ORM, PostgreSQL.
- **Auth**: Auth.js (NextAuth v5) with Prisma adapter.
- **AI**: provider abstraction (`lib/ai`) supporting `mock` (default), OpenAI, Anthropic, Gemini.
- **Files**: `pdf-parse` (PDF), `mammoth` (DOCX), plain text; server-side PDF via headless Chrome (`puppeteer-core`).
- **Storage**: abstraction (`lib/storage`) with a local dev driver and an S3/R2-ready interface.

## Architecture

```
app/            (marketing) · (auth) · dashboard · api routes
components/      ui · marketing · dashboard · resume · documents · shared
lib/            ai (provider/prompts/services) · auth · db · storage · pdf
                validation · file (extract/chunk) · usage · plans
prisma/         schema.prisma · seed.ts
```

- AI prompts and services live in `lib/ai` (never inside React components). Structured JSON responses are parsed and validated.
- Business logic (usage limits, ownership, validation) is centralized in `lib` and reused across routes.

## Installation

Prerequisites: **Node 20+** and **PostgreSQL 14+**.

```bash
npm install
cp .env.example .env        # defaults work for local dev
```

### Database setup

This repo includes a self-contained Postgres helper that runs a per-project cluster as your user (no sudo, no system service):

```bash
npm run db:start            # initializes ./.pgdata and starts Postgres on :5432
npm run db:migrate          # apply Prisma migrations
npm run db:seed             # demo user + sample data
```

Already have your own PostgreSQL? Just set `DATABASE_URL` in `.env` and run `npm run db:migrate && npm run db:seed`.

### Running locally

```bash
npm run dev                 # http://localhost:3000
```

Demo login (from the seed): **demo@example.com** / **demo12345**

## Environment Variables

See [`.env.example`](./.env.example). Key variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js session secret |
| `AI_PROVIDER` | `mock` (default), `openai`, `anthropic`, or `gemini` |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | AI keys (only if not using `mock`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth |
| `STORAGE_DRIVER` | `local` (default) or `s3` |
| `PUPPETEER_EXECUTABLE_PATH` | Chrome/Chromium path for PDF export |

Never commit `.env` or secret values.

## AI Provider Setup

The default `mock` provider needs no configuration. To use a real provider:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

The provider interface (`lib/ai/provider.ts`) exposes a single `complete()` method; `lib/ai/services` builds prompts and validates structured output. Add a provider by implementing the `AIProvider` interface.

## Storage Setup

`STORAGE_DRIVER=local` stores uploads under `./.storage` (git-ignored, never public). For S3/R2, implement the `S3Storage` driver in `lib/storage/index.ts` and set the `STORAGE_*` variables. Files are always served through authenticated, ownership-checked routes.

## Testing

```bash
npm run test        # unit tests (Vitest): chunking, grounded mock AI, validation, plan limits
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
```

## Production Deployment

```bash
npm run build       # prisma generate && next build
npm run db:deploy   # prisma migrate deploy
npm run start
```

Set production values for `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, your chosen `AI_PROVIDER` + key, and storage credentials. Ensure a Chrome/Chromium binary is available for PDF export (`PUPPETEER_EXECUTABLE_PATH`).

## Security Notes

- Every API route derives the user from the server-side session; client-provided user IDs are never trusted.
- Resource ownership is verified server-side; cross-user access returns 404.
- Usage limits are enforced server-side and cannot be bypassed by calling the API directly.
- Uploads are validated by type and size; extraction failures are handled gracefully.
- Errors returned to clients never include stack traces, database errors, or secrets.

## Payments

The pricing page is structured for a real payment provider (e.g. Stripe). Payment integration is a placeholder in this build; `STRIPE_*` variables are reserved for wiring it up.
