# Project Management Lite (Supabase)

This app now uses Supabase REST (no Prisma runtime dependency for app features).

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

## Supabase SQL setup

Run SQL from:

`supabase/schema.sql`

in Supabase SQL Editor.

## Local run

```bash
npm install
npm run dev
```

## Deploy

```bash
npx vercel --prod
```

`vercel-build` runs only `next build`, so deployment does not require Prisma env vars.

