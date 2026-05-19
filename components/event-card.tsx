import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import type { BonkhouseEvent } from "@/types/bonkhouse";

export function EventCard({ event }: { event: BonkhouseEvent }) {
  const archived = event.status === "archived" || new Date(event.startsAt) < new Date();

  return (
    <article className="club-card group overflow-hidden rounded-lg p-3 transition hover:-translate-y-1">
      <div
        className={
          event.posterUrl
            ? "relative aspect-[555/740] overflow-hidden rounded-md border border-white/25 bg-black"
            : "photo-frame h-36 rounded-md"
        }
      >
        {event.posterUrl ? (
          <img
            alt={`${event.title} poster`}
            className="absolute inset-0 h-full w-full object-cover"
            src={event.posterUrl}
          />
        ) : null}
        <Link
          aria-label={`Open ${event.title}`}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/60 bg-black/70 text-white transition group-hover:border-butter group-hover:text-butter"
          href={`/events/${event.slug}`}
        >
          <ArrowRight size={17} />
        </Link>
      </div>
      <div className="grid grid-cols-[4.2rem_1fr] gap-4 pt-4">
        <div className="grid h-16 place-items-center rounded-md border border-butter text-center text-butter">
          <div>
            <p className="text-xs font-black uppercase">
              {new Date(event.startsAt).toLocaleString("en-US", { month: "short" })}
            </p>
            <p className="font-display text-3xl leading-none">{new Date(event.startsAt).getDate()}</p>
          </div>
        </div>
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-butter">
            {formatEventTime(event.startsAt)} | {event.venue.name}
          </p>
          <h3 className="mt-2 font-display text-2xl uppercase leading-none text-white">{event.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/66">{event.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge className={archived ? "border-sage/60 text-sage" : "border-butter/60 text-butter"}>
          {archived ? "Archived" : "RSVP open"}
        </Badge>
        {event.isInviteOnly ? <Badge>Invite code</Badge> : <Badge>Discussion to follow</Badge>}
      </div>
      <div className="sr-only">
        <CalendarDays /> {formatEventDate(event.startsAt)}
        <MapPin /> {event.venue.name}
      </div>
    </article>
  );
}
