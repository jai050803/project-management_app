# Project Management Lite (Next.js)

A lightweight project management dashboard for small teams:
- Create project with name + auto code
- Join project using code only
- Shared team dashboard
- Task CRUD with priority, status, assignee, deadline, progress
- Task detail page with docs (PDF/images via upload, links), daily remarks, notes, dependencies
- Progress bar, completed vs pending chart, deadline alerts, roadmap timeline

## 1. Local setup

```bash
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`.

Optional demo data:

```bash
npm run prisma:seed
```

## 2. Deployment (Vercel)

1. Create a Postgres DB (Vercel Postgres, Neon, Supabase, etc.).
2. In Vercel project env vars, set `DATABASE_URL`.
3. Deploy:

```bash
npx vercel --prod
```

This repo includes a `vercel-build` script that runs:
- `prisma generate`
- `prisma migrate deploy`
- `next build`

So tables are initialized automatically during deployment.

## 3. Important note on uploads

File uploads are stored as Base64 in database for simplicity (3MB max). For larger scale, use object storage (S3/R2/Supabase Storage) and save only URLs in DB.

