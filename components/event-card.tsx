import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatEventTime, publicAsset } from "@/lib/utils";
import type { BonkhouseEvent } from "@/types/bonkhouse";

export function EventCard({ event }: { event: BonkhouseEvent }) {
  const archived = event.status === "archived" || new Date(event.startsAt) < new Date();
  const useExistingPoster = archived && event.posterUrl;

  return (
    <article className="club-card group overflow-hidden rounded-lg p-3 transition hover:-translate-y-1">
      <div className="relative aspect-[555/740] overflow-hidden rounded-md border border-white/20 bg-[#e8e1cf] text-black">
        {useExistingPoster ? (
          <img
            alt={`${event.title} poster`}
            className="absolute inset-0 h-full w-full object-cover"
            src={publicAsset(event.posterUrl)}
          />
        ) : (
          <ScreeningPosterTemplate event={event} archived={archived} />
        )}
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

function ScreeningPosterTemplate({ event, archived }: { event: BonkhouseEvent; archived: boolean }) {
  const startsAt = new Date(event.startsAt);
  const month = startsAt.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = startsAt.getDate();
  const title = simplifyTitle(event.title);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e8e1cf]">
      <div className="absolute inset-0 bg-[radial-gradient(#111_1px,transparent_1px)] bg-[size:14px_14px] opacity-[0.08]" />
      <div className="absolute inset-5 border border-black/12" />
      <div className="absolute -left-10 top-10 h-9 w-36 rotate-[-35deg] bg-white/45 shadow-sm" />
      <div className="absolute -right-10 bottom-20 h-9 w-36 rotate-[-35deg] bg-white/45 shadow-sm" />

      <div className="absolute left-6 top-6 z-10 bg-[#f6f0df] px-3 py-2 text-center shadow-sm">
        <p className="font-special text-xs font-bold uppercase leading-none text-[#a83428]">{month}</p>
        <p className="mt-1 font-special text-5xl font-bold leading-none text-black">{day}</p>
      </div>

      <div className="absolute inset-x-8 top-24 z-10 border-y border-black/15 py-3 text-center">
        <p className="font-special text-[0.62rem] uppercase tracking-[0.28em] text-black/55">
          Sunday Afternoon Bonkhouse
        </p>
      </div>

      <div className="absolute inset-x-8 top-[12.5rem] z-10">
        <h3 className="font-bebas text-5xl uppercase leading-[0.88] tracking-wide text-black sm:text-6xl">
          {title}
        </h3>
        <p className="mt-4 max-w-[20rem] font-special text-sm leading-5 text-black/68">
          {event.kicker || event.description}
        </p>
      </div>

      <div className="absolute inset-x-8 bottom-20 z-10 flex justify-center">
        <span className="rotate-[-1.5deg] bg-butter px-4 py-1 font-special text-xs font-bold uppercase tracking-wider text-black shadow-sm">
          {archived ? "Past screening" : "RSVP open"}
        </span>
      </div>

      <div className="absolute inset-x-8 bottom-8 z-10 flex justify-between border-t border-black/15 pt-3 font-special text-[0.58rem] uppercase tracking-[0.16em] text-black/58">
        <span>{formatEventTime(event.startsAt)}</span>
        <span>{event.venue.neighborhood}</span>
      </div>
    </div>
  );
}

function simplifyTitle(title: string) {
  return title
    .replace("Sunday Afternoon Bonkhouse ", "")
    .replace("Bonkhouse and House Pardee Present: ", "")
    .replace("Sunday Afternoon Bonkhouse Presents ", "")
    .replace(" Creature Double Feature", " Creature")
    .replace(" Double Feature", "");
}
