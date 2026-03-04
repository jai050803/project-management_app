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
npx prisma migrate dev --name init
npm run dev
```

Open `http://localhost:3000`.

Optional demo data:

```bash
npm run prisma:seed
```

## 2. Deployment (Vercel)

This app can deploy to Vercel, but for production use a hosted Postgres DB.

### Recommended production DB switch

1. Replace datasource in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Create a Neon / Supabase / Vercel Postgres database.
3. Add `DATABASE_URL` in Vercel project environment variables.
4. Run migration to production DB:

```bash
npx prisma migrate deploy
```

### Deploy steps

```bash
npm i -g vercel
vercel
```

During first deploy, configure env vars:
- `DATABASE_URL`

For every production deploy:

```bash
vercel --prod
```

## 3. Important note on uploads

File uploads are stored as Base64 in database for simplicity (3MB max). For larger scale, use object storage (S3/R2/Supabase Storage) and save only URLs in DB.

