import { MailingListForm } from "@/components/mailing-list-form";

export default function AboutPage() {
  return (
    <div className="club-container grid gap-8 py-10 lg:grid-cols-[1fr_0.9fr]">
      <section>
        <p className="eyebrow">About</p>
        <h1 className="font-display text-6xl uppercase leading-none tracking-[-0.06em] text-white">
          A social club pretending to be a screening series
        </h1>
        <div className="mt-6 space-y-5 text-lg leading-8 text-white/70">
          <p>
            Sunday Afternoon Bonkhouse started as a reason to gather friends and watch movies.
            It has grown into a Culver City community ritual with double features, trailers,
            a pre-show, and a room that sometimes needs overflow chairs.
          </p>
          <p>
            The point is simple: arrive before the gate closes, find a seat, talk to someone
            you did not know yet, and let Sunday become a little stranger and warmer than it
            was supposed to be.
          </p>
          <p>
            Screenings are public for the community, but the room has real limits. The RSVP
            system helps us know when the house is full, when the overflow chairs come out,
            and when the waitlist needs a kind note.
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
