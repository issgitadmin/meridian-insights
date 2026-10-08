# Meridian Insights

Password-protected sales dashboard built with Next.js 15 and Tailwind CSS. Shared snapshots are stored in Supabase.

## How it works

1. **Login** (`/login`): everything is behind one team password (`APP_PASSWORD`). After a correct entry the server sets a signed, httpOnly cookie that lasts 7 days.
2. **Upload** (`/upload`): drop in a CSV with the Meridian deal columns. It's parsed in the browser and kept in this tab's session storage.
3. **Insights** (`/insights`): revenue over time, pipeline by stage, rep performance, time to close by product, win rate by lead source, a calculated summary, and a searchable customer table. You can filter by product, industry and rep.
4. **Share**: saves the dataset as a snapshot in Supabase and returns a `/share/<uuid>` link. Recipients enter the same password and land on the snapshot with all the insights already loaded.

## Supabase

Project `meridian-insights` (`dfywkkeojuezxekjxdks`). The `public.snapshots` table has RLS enabled with **no policies**, so it can't be read or listed directly through the API. The app only reaches it through two `SECURITY DEFINER` functions, `create_snapshot(p_name, p_deals)` and `get_snapshot(p_id)`. Both are called from server routes, so the Supabase key never reaches the browser.

## Local development

```bash
cp .env.example .env.local   # then fill in values
npm install
npm run dev
```

## Deploying (GitHub + Vercel)

1. Push this folder to a GitHub repo. `.env.local` is gitignored.
2. Import the repo in Vercel. It detects Next.js automatically.
3. Add these environment variables in Vercel (Production and Preview):
   - `APP_PASSWORD` = `OPS123`
   - `AUTH_SECRET`: a long random string (`openssl rand -hex 32`)
   - `SUPABASE_URL` = `https://dfywkkeojuezxekjxdks.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY`: from Supabase → Project Settings → API Keys
4. Deploy. Share links use whatever domain the app is served from.

Changing `APP_PASSWORD` or `AUTH_SECRET` signs everyone out.
