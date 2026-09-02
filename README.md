# Sunday Afternoon Bonkhouse

A playful neighborhood film club site with free RSVP ticketing, QR check-in, photos, merch listings, and a Supabase-backed admin dashboard.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Adding a screening

See [HOW-TO-ADD-A-NEW-SCREENING.md](HOW-TO-ADD-A-NEW-SCREENING.md). Short version: create it at `/admin`, upload the art, set it to Published. No code changes, no deploy.

## How the site is put together

- **Public pages** (`/`, `/screenings`, `/events/<slug>`) are static design-canvas files in `public/` (`home.dc.html`, `screenings.dc.html`, `event.dc.html`, plus the shared `Ticket.dc.html` and `SiteHeader.dc.html`). Netlify and `next.config.ts` route to them. They read screening data in the browser through `public/events.js`.
- **Screening data** lives in the Supabase `events` table, exposed to the browser through the guest-safe `public_events` view. That view also defines the current screening (`is_upcoming`).
- **React pages** under `app/` cover the rest: about, photos, merch, the ticket verification page, the admin dashboard, and the API routes (RSVP, email, uploads).

## Supabase

The app is configured for project `nwnxoqrmqsjyznegykfc`.

```bash
supabase login
supabase init
supabase link --project-ref nwnxoqrmqsjyznegykfc
supabase db push
```

Migrations live in `supabase/migrations/` and are applied in file order. If you apply them by hand, paste each into the SQL editor in that order.

## Admins

Admin access uses Supabase magic links and the `admin_profiles` table. Add approved admin emails there after running the migration.

## Email

Ticket email delivery goes through `lib/email.ts` (Resend). Until `RESEND_API_KEY` is set, confirmation emails are logged on the server.

## Checks

```bash
npm run typecheck
npx tsx scripts/check-event-fields.ts
```
