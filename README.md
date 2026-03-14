# LendFlow

LendFlow is a role-based lending workflow app built with Next.js + Supabase.
It supports borrower self-service (apply, upload documents, track status) and officer operations (pipeline review, AI decision support, final actions).

## Core Features

- Borrower and officer authentication with role-aware routing
- Loan product catalog and multi-step borrower application flow
- AI/rules-based underwriting pass with confidence and risk metadata
- Officer review page with approve/reject/request-info actions
- Document upload + verification workflow
- Notifications and audit trail tables in Supabase

## Tech Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS + reusable UI primitives
- Supabase Auth, Postgres, Storage, and RLS policies

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

3. Apply database schema:

- Open your Supabase SQL editor
- Run `scripts/schema.sql`
- If your project already had older policies, also run `scripts/fix_profiles_rls.sql`

4. Create storage bucket:

- In Supabase Storage, create bucket `loan-documents`
- Keep it public for demo file download links

5. Seed demo data:

```bash
npm run seed
```

6. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo Accounts

- Borrower: `borrower@demo.com` / `Demo@1234`
- Officer: `officer@demo.com` / `Demo@1234`

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run seed` - insert demo users/products/applications
- `npm run verify:supabase` - verify demo auth + RLS table access
