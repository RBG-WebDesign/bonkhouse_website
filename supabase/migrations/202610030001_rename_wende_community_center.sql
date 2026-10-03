-- Venue naming requested by the Wende Museum on September 13, 2026.
-- Public pages and ticket emails read this shared venue row. Rename it in
-- place, preserving its ID, address (10858 Culver Blvd), and entry instructions.
-- Apply before deploying the updated admin defaults so new events reuse it.
update public.venues
set name = 'Wende Museum’s Community Center'
where name in (
  'Glorya Kaufman Community Center',
  'Gloria Kaufman Community Center'
);
