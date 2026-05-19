import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getEvents } from "@/lib/data";
import { formatEventDate } from "@/lib/utils";

export default async function PreviousScreeningsPage() {
  const events = await getEvents();
  const past = events
    .filter((event) => new Date(event.startsAt) < new Date() || event.status === "archived")
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  return (
    <div className="archive-page hero-swirl min-h-screen pb-14 pt-12">
      <div className="club-container text-center">
        <h1 className="font-display text-6xl uppercase leading-none tracking-[-0.05em] text-white md:text-7xl">Previous Screenings</h1>
        <p className="scribble-logo mx-auto mt-4 max-w-4xl text-2xl leading-none text-butter md:text-3xl">
          The films we’ve watched, argued about, overanalyzed, and probably changed our lives.
        </p>
        <p className="mt-5 font-mono text-sm uppercase tracking-[0.12em] text-white/80">In chronological (ish) order</p>
      </div>
      <div className="club-container mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {past.map((event, index) => (
          <Link className="paper-poster group block rotate-card" href={`/events/${event.slug}`} key={event.id} style={{ "--r": `${(index % 5) - 2}deg` } as React.CSSProperties}>
            <div className="poster-date">
              <span>{new Date(event.startsAt).toLocaleString("en-US", { month: "short" })}</span>
              <strong>{new Date(event.startsAt).getDate()}</strong>
            </div>
            <div className="poster-art">
              {event.posterUrl ? <img alt={`${event.title} poster`} src={event.posterUrl} /> : null}
            </div>
            <h2>{event.title}</h2>
            <p>{event.kicker || event.description}</p>
            <span className="poster-tag">{event.isInviteOnly ? "Double feature" : "Discussion to follow"}</span>
            <span className="sr-only">{formatEventDate(event.startsAt)}</span>
          </Link>
        ))}
      </div>
      <div className="club-container mt-12 text-center">
        <p className="scribble-logo text-4xl text-white">Want to see what’s next?</p>
        <Link className="mt-4 inline-flex items-center gap-3 rounded-md bg-butter px-7 py-4 text-sm font-black uppercase text-black" href="/screenings">
          View upcoming screenings
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
