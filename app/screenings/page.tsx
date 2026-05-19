import { EventCard } from "@/components/event-card";
import { getEvents } from "@/lib/data";

export default async function ScreeningsPage() {
  const events = await getEvents();
  const upcoming = events.filter((event) => new Date(event.startsAt) >= new Date() && event.status !== "archived");
  const past = events.filter((event) => new Date(event.startsAt) < new Date() || event.status === "archived");

  return (
    <div className="club-container py-10">
      <div className="max-w-3xl">
        <p className="eyebrow">Screenings</p>
        <h1 className="font-display text-6xl uppercase leading-none tracking-[-0.06em] text-white">
          Upcoming and past Sundays
        </h1>
        <p className="mt-4 text-lg leading-8 text-white/68">
          RSVP for the next room, or wander the archive of previous double features.
        </p>
      </div>
      <section className="mt-10">
        <h2 className="font-display text-4xl uppercase text-white">Upcoming</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {upcoming.length ? upcoming.map((event) => <EventCard event={event} key={event.id} />) : <p className="text-white/62">No upcoming screenings yet.</p>}
        </div>
      </section>
      <section className="mt-12">
        <h2 className="font-display text-4xl uppercase text-white">Past screenings archive</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {past.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
