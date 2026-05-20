import { MailingListForm } from "@/components/mailing-list-form";

export default function AboutPage() {
  return (
    <div className="club-container grid gap-8 py-10 lg:grid-cols-[1fr_0.9fr]">
      <section>
        <p className="eyebrow">About</p>
        <h1 className="max-w-2xl font-display text-5xl uppercase leading-[0.92] tracking-[-0.05em] text-white sm:text-6xl">
          Handmade movie afternoons for people who like the weird stuff between the movies
        </h1>
        <div className="mt-6 space-y-5 text-lg leading-8 text-white/70">
          <p>
            Sunday Afternoon Bonkhouse grew out of five years of friends gathering around
            a screen and turning movie day into something handmade.
          </p>
          <p>
            We build custom double features from movies, old trailers, commercials, shorts,
            animations, videos, and art made by people we love. The feature is the anchor,
            but the pre-show, intermission, and surprises are part of the reason to show up.
          </p>
          <p>
            Come for the movies, stay for the original pieces, the odd little discoveries,
            and the room full of people letting Sunday get stranger than planned.
          </p>
        </div>
      </section>
      <aside className="grid gap-5">
        <div className="club-card p-6">
          <p className="font-display text-4xl uppercase text-white">House rhythm</p>
          <ul className="mt-4 space-y-3 font-bold text-white/76">
            <li>Doors and side gate open before showtime.</li>
            <li>Pre-show reels play before the first feature.</li>
            <li>Intermission brings more trailers and commercials.</li>
            <li>The second feature closes the afternoon.</li>
          </ul>
        </div>
        <MailingListForm />
      </aside>
    </div>
  );
}
