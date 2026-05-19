# Sunday Afternoon Bonkhouse

A playful neighborhood film club site with free RSVP ticketing, QR check-in, photos, merch listings, and a Supabase-backed admin dashboard.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase

The app is configured for project `nwnxoqrmqsjyznegykfc`.

```bash
supabase login
supabase init
supabase link --project-ref nwnxoqrmqsjyznegykfc
supabase db push
```

The schema lives in `supabase/migrations/202605190001_bonkhouse_schema.sql`.

## Admins

Admin access uses Supabase magic links and the `admin_profiles` table. Add approved admin emails there after running the migration.

## Email

Ticket email delivery is scaffolded through `lib/email.ts`. Until `RESEND_API_KEY` is set, confirmation emails are logged on the server.
