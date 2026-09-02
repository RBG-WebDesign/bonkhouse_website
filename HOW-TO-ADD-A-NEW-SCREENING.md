# HOW TO ADD A NEW SCREENING

Everything the site knows about a screening lives in **one place: the `events` table in Supabase**, edited at **bonkhouse.com/admin**. The homepage hero, the ticket, the Screenings page, the event page, the RSVP form, and the confirmation email all read that one record. You never edit movie details in code, and you never deploy for a new screening.

## 1. Create the screening

1. Sign in at `/admin` (magic link; your email must be in `admin_profiles`).
2. Either click **Create screening**, or open the previous screening and hit **Duplicate as draft** to start from its settings.
3. Fill in the form. What each field drives:

| Field | Where it shows up |
|---|---|
| Title | Event page headline, email subject, ticket alt text |
| Short title | The big line on the ticket (e.g. `SOCIETY + VIDEODROME`). Falls back to Title. |
| Ticket tag | The yellow tape on the ticket (e.g. `BODY HORROR DOUBLE FEATURE`) and the coloured tag on archive cards |
| Web address | The permanent link, `/events/<slug>`. Auto-filled from the title; do not change it after announcing. |
| One-line teaser | Yellow line under the title on the event page and the blurb on archive cards |
| Description | Event page paragraph |
| Poster | Homepage hero, event page, archive cards |
| Second poster | Optional. The hero and event page alternate between the two posters. |
| Event logo | Optional. Sits on the ticket above the short title. Upload a **trimmed** transparent PNG. |
| Venue name / address | Ticket, event page, archive cards, and the ticket email |
| Doors / Starts / Ends / Gate closes | Every time label on the site and in the email |
| RSVPs open / close | Leave blank to open now and close when the gate closes |
| Capacity | Seats, overflow, and max tickets per RSVP |
| Program | Numbered list on the event page (one item per line) |
| Notes | Gate instructions go in the email; the accessibility note shows on the event page |
| Status | See step 3 |

## 2. Add the artwork

Upload the poster (2:3 works best), optionally the second poster, and optionally the logo, using the upload buttons. Files land in Supabase storage; nothing needs to be committed to the repo.

## 3. Make it current

Set **Status = Published** and save. That is the whole switch:

- The **soonest published screening whose showtime has not passed** is the current one, everywhere.
- The previous screening moves to **Past Screenings** on its own, six hours after its showtime. You can also set it to **Archived** whenever you like; it keeps its poster, title, date, and page at its old link.
- Not ready to announce? Leave it as **Draft**. Drafts are invisible to the public.
- Want it visible but not taking RSVPs yet? Publish it and set **RSVPs open** to a future time. The page shows "RSVPs open soon".

## 4. Deploy

Nothing. The site reads Supabase live; changes appear on the next page load.

## What happens on its own

- **Sold out:** when every seat and overflow seat is claimed, the form becomes "Join the waitlist" and RSVPs go to the waitlist.
- **RSVPs close** at the gate-close time unless you set an explicit close time.
- **Two published screenings:** the soonest is current; the other appears under "Coming Up" on the Screenings page.
- **Nothing published:** the homepage and Screenings page show a "nothing on the calendar yet" note with the mailing-list link. Nothing breaks.
- **Missing poster:** a title card is shown in its place.
- **Old links** to `/events/<slug>` keep working for archived screenings.

## Checklist

- [ ] Title, short title, ticket tag
- [ ] Poster (and second poster / logo if you have them)
- [ ] Venue, doors, start, end, gate close
- [ ] Program
- [ ] Gate instructions (they go in the email)
- [ ] Status → Published
- [ ] Open the homepage, `/screenings`, and `/events/<slug>` once to admire it

## One-time setup (already done unless the database was reset)

Apply `supabase/migrations/202609020001_screening_source_of_truth.sql` in the Supabase SQL editor. It adds the ticket-art columns, the `is_upcoming` flag, the seat counter, and the RSVP close rule the site relies on, and corrects the venue name to Glorya Kaufman Community Center.

## For developers

- `public/events.js` reads the `public_events` view and shapes it for the pages. It contains no movie data.
- `public/Ticket.dc.html` is the ticket; `public/home.dc.html`, `public/screenings.dc.html`, and `public/event.dc.html` are the pages. All of them only bind fields; none of them know which movie is current.
- `/events/*` is routed to `event.dc.html` in `netlify.toml` and `next.config.ts`; no per-movie rules.
- The RSVP API (`app/api/rsvp/route.ts`) and the ticket email read the same `events` row.
