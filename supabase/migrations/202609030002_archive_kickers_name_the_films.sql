-- Archived screenings: the yellow kicker line under the title names the films
-- that played instead of a tagline. (The two 2022 screenings already do.)
-- Also carries the description/program copy from 202609020001, which never
-- landed on these rows in production. Safe to re-run.

update public.events set
  kicker = 'Return of the Living Dead with a pre-show.',
  description = 'Return of the Living Dead, with a pre-show, at Lumiere Music Hall.',
  program = array['Pre-show', 'Return of the Living Dead'],
  updated_at = now()
where slug = 'return-of-the-sunday-afternoon-bonkhouse-of-the-dead';

update public.events set
  kicker = 'House (1977) and House (1985) with a pre-show.',
  description = 'Bonkhouse and House Pardee presented a Halloween double feature: House (1977) and House (1985), with a pre-show, at Lumiere Music Hall.',
  program = array['Pre-show', 'House (1977)', 'Intermission', 'House (1985)'],
  updated_at = now()
where slug = 'house-house-halloween-double-feature';

update public.events set
  kicker = 'Ticks and Demons with a pre-show.',
  description = 'A creature double feature: Ticks and Demons, with a pre-show and intermission, at LOOK Dine-In Cinemas Glendale.',
  program = array['Pre-show', 'Ticks', 'Intermission', 'Demons'],
  updated_at = now()
where slug = 'infested-creature-double-feature';

update public.events set
  kicker = 'Chopping Mall and Hello Mary Lou: Prom Night II with a special pre-show.',
  description = 'An 80''s B-movie double feature: Chopping Mall and Hello Mary Lou: Prom Night II, with a special pre-show and intermission.',
  program = array['Special pre-show', 'Chopping Mall', 'Intermission', 'Hello Mary Lou: Prom Night II'],
  updated_at = now()
where slug = 'retail-rampage-prom-dance-bloodbath';
