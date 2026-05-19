import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clapperboard,
  CupSoda,
  Heart,
  MessageCircle,
  Popcorn,
  Sparkles,
  Ticket,
  Users
} from "lucide-react";
import { EventCard } from "@/components/event-card";
import { MailingListForm } from "@/components/mailing-list-form";
import { buttonVariants } from "@/components/ui/button";
import { getEvents } from "@/lib/data";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import type { BonkhouseEvent } from "@/types/bonkhouse";

export default async function Home() {
  const events = await getEvents();
  const upcoming = events.filter((event) => new Date(event.startsAt) >= new Date() && event.status !== "archived");
  const nextEvent = upcoming[0] || events[0];
  const cards = makeHomeCards(upcoming, nextEvent);

  return (
    <div className="bg-black text-ink">
      <section className="club-shell relative overflow-hidden">
        <div className="club-container grid min-h-[38rem] gap-8 py-10 lg:grid-cols-[3rem_1.06fr_1fr_0.62fr] lg:py-0">
          <aside className="hidden items-center justify-center border-r border-white/15 lg:flex">
            <div className="vertical-slogan text-[0.65rem] font-black uppercase text-white/48">
              Every Sunday. Every Bonk.
            </div>
          </aside>

          <div className="relative z-10 flex flex-col justify-center py-10">
            <p className="eyebrow">Welcome to Bonkhouse</p>
            <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[0.96] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
              A Film Social Club for People Who Like Movies a Normal Amount
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/72">
              Every Sunday afternoon we gather to watch films, talk about them,
              overthink them, misremember them, and pretend that snacks are not
              the main reason we came.
            </p>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.14em] text-butter">
              Every Sunday. Every Bonk.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link className={buttonVariants({ size: "lg" })} href="/screenings">
                See upcoming screenings
                <ArrowRight size={18} />
              </Link>
              <Link className={buttonVariants({ size: "lg", variant: "secondary" })} href="/about">
                Become a member
              </Link>
            </div>
          </div>

          <div className="relative min-h-[24rem] overflow-hidden border-x border-white/15 lg:min-h-[38rem]">
            <div className="photo-frame photo-warm absolute inset-0" />
            <div className="absolute inset-x-8 bottom-8 z-10 border border-white/25 bg-black/72 p-4 backdrop-blur">
              <p className="eyebrow">Next screening</p>
              <p className="mt-1 font-display text-3xl uppercase leading-none text-white">{nextEvent.title}</p>
              <p className="mt-2 text-sm text-white/70">
                {formatEventDate(nextEvent.startsAt)} · {formatEventTime(nextEvent.startsAt)}
              </p>
            </div>
          </div>

          <div className="relative min-h-[30rem] lg:min-h-[38rem]">
            <div className="photo-frame absolute right-2 top-6 h-44 w-56 rotate-3 border-[8px] border-white/85 shadow-soft sm:w-64" />
            <div className="absolute left-3 top-52 z-10 grid h-36 w-36 rotate-[-10deg] place-items-center rounded-full border-4 border-white bg-black text-center">
              <p className="scribble-logo text-xl leading-none text-white">
                Every Sunday
                <br />
                Afternoon
                <br />
                <span className="text-butter">Your Sundays</span>
                <br />
                Belong to us :)
              </p>
            </div>
            <div className="photo-frame photo-warm absolute bottom-8 right-0 h-40 w-52 rotate-[-2deg] border-[8px] border-white/85 shadow-soft sm:w-60" />
            <div className="absolute bottom-20 left-2 hidden h-20 w-20 rotate-[-12deg] place-items-center border border-butter text-butter lg:grid">
              <Ticket />
            </div>
          </div>
        </div>
      </section>

      <section className="club-shell">
        <div className="club-container py-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Upcoming Sundays</p>
              <h2 className="font-display text-4xl uppercase tracking-[-0.05em] text-white">Next Screenings</h2>
            </div>
            <Link className="hidden items-center gap-2 text-xs font-black uppercase text-butter sm:inline-flex" href="/screenings">
              View all screenings
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="club-shell">
        <div className="club-container grid gap-8 py-9 lg:grid-cols-[0.92fr_1.35fr] lg:items-center">
          <div>
            <p className="eyebrow">About the club</p>
            <h2 className="mt-2 font-display text-4xl uppercase tracking-[-0.05em] text-white">
              More Than a Movie Night.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
              Sunday Afternoon Bonkhouse is a social film club for people who love cinema
              and the conversations it sparks. We meet every Sunday to watch thoughtfully
              curated films, share ideas, and hang out in a relaxed, welcoming space.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                [Clapperboard, "Thoughtful Screenings"],
                [MessageCircle, "Real Conversations"],
                [Users, "Good People"],
                [CupSoda, "Comfy Seats"]
              ].map(([Icon, label]) => {
                const IconComponent = Icon as typeof Clapperboard;
                return (
                  <div className="border-l border-white/18 px-4 text-center" key={label as string}>
                    <IconComponent className="mx-auto text-butter" size={28} strokeWidth={1.5} />
                    <p className="mt-3 text-xs leading-4 text-white/72">{label as string}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_0.65fr_1fr]">
            <div className="photo-frame photo-warm relative h-56 rotate-1 border-[7px] border-white/80 shadow-soft">
              <span className="tape -top-3 left-14 rotate-6" />
            </div>
            <div className="grid min-h-56 rotate-[-4deg] place-items-center border border-white/50 bg-[#111] p-5 text-center shadow-soft">
              <p className="scribble-logo text-4xl uppercase leading-tight text-white">
                Watch
                <br />
                Talk
                <br />
                Hang
                <br />
                <span className="rounded-full border border-butter px-3 text-butter">Repeat</span>
              </p>
            </div>
            <div className="photo-frame relative h-56 rotate-3 border-[7px] border-white/80 shadow-soft">
              <span className="tape -top-2 right-12 rotate-[-8deg]" />
            </div>
          </div>
        </div>
      </section>

      <section className="club-shell">
        <div className="club-container grid gap-0 py-7 md:grid-cols-[1fr_repeat(5,1fr)]">
          <div className="border-white/15 py-4 md:border-r">
            <p className="eyebrow">Membership perks</p>
            <h2 className="mt-2 max-w-48 font-display text-3xl uppercase leading-none text-white">
              Be Part of The Club.
            </h2>
          </div>
          {[
            [Ticket, "Members-Only Screenings", "Special events and early access to tickets."],
            [CalendarDays, "Guest Passes", "Bring a friend along to select screenings."],
            [Sparkles, "10% Off Concessions", "Because great films are better with snacks."],
            [BookOpen, "The Journal", "Member-only essays, notes, and film picks."],
            [Heart, "Community First", "A creative, kind, and curious crew."]
          ].map(([Icon, title, copy]) => {
            const IconComponent = Icon as typeof Ticket;
            return (
              <div className="border-white/15 px-5 py-4 text-center md:border-r" key={title as string}>
                <IconComponent className="mx-auto text-butter" size={30} strokeWidth={1.5} />
                <p className="mt-4 text-sm font-black text-white">{title as string}</p>
                <p className="mt-2 text-xs leading-5 text-white/58">{copy as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="club-container grid grid-cols-2 gap-1 py-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className={index % 2 === 0 ? "photo-frame photo-warm h-28" : "photo-frame h-28"} key={index} />
        ))}
      </section>

      <section className="club-container pb-10">
        <MailingListForm />
      </section>
    </div>
  );
}

function makeHomeCards(upcoming: BonkhouseEvent[], nextEvent: BonkhouseEvent) {
  if (upcoming.length >= 3) {
    return upcoming.slice(0, 3);
  }

  const baseDate = new Date(nextEvent.startsAt);
  return [
    nextEvent,
    cloneEvent(nextEvent, "wanderlust-wide-shots", "Wanderlust & Wide Shots", 7, "Stories of travel, longing, and the open road."),
    cloneEvent(nextEvent, "city-lights-late-nights", "City Lights, Late Nights", 14, "Neon streets, quiet moments, and everything in between.")
  ].slice(0, 3).map((event, index) => {
    if (index === 0) {
      return event;
    }
    return {
      ...event,
      startsAt: new Date(baseDate.getTime() + index * 7 * 24 * 60 * 60 * 1000).toISOString(),
      doorsAt: new Date(baseDate.getTime() + index * 7 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString()
    };
  });
}

function cloneEvent(
  event: BonkhouseEvent,
  slug: string,
  title: string,
  dayOffset: number,
  description: string
): BonkhouseEvent {
  const startsAt = new Date(new Date(event.startsAt).getTime() + dayOffset * 24 * 60 * 60 * 1000).toISOString();
  return {
    ...event,
    id: slug,
    slug,
    title,
    description,
    startsAt,
    doorsAt: new Date(new Date(startsAt).getTime() - 45 * 60 * 1000).toISOString(),
    gateClosesAt: new Date(new Date(startsAt).getTime() + 10 * 60 * 1000).toISOString()
  };
}
