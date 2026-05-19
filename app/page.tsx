import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { buttonVariants } from "@/components/ui/button";
import { getEvents } from "@/lib/data";

export default async function Home() {
  const events = await getEvents();
  const upcoming = events.filter((event) => new Date(event.startsAt) >= new Date() && event.status !== "archived");
  const featured = upcoming.length ? upcoming.slice(0, 3) : events.slice(0, 3);

  return (
    <div className="bg-black text-ink">
      <section className="hero-swirl relative overflow-hidden">
        <div className="club-container relative z-10 grid min-h-[44rem] gap-10 py-12 lg:grid-cols-[1fr_18rem] lg:items-center">
          <div>
            <p className="scribble-logo text-6xl leading-none text-white sm:text-7xl lg:text-8xl">Welcome to</p>
            <h1 className="mt-1 font-display text-7xl uppercase leading-[0.82] tracking-[-0.07em] sm:text-8xl lg:text-[9.5rem]">
              <span className="bonk-outline">Bonkhouse</span>
            </h1>
            <p className="mt-7 max-w-3xl font-mono text-2xl font-black leading-tight text-white sm:text-3xl">
              A place for films, friends, and whatever happens <span className="underline decoration-butter decoration-4 underline-offset-8">after the credits.</span>
            </p>
            <p className="mt-8 max-w-2xl font-mono text-base leading-6 text-white">
              Every Sunday afternoon, we gather around a screen and let a movie do what movies do best: make everyone feel normal, weird, lonely, connected, suspicious of their own childhood, or suddenly very interested in lighting.
            </p>
            <p className="mt-7 font-mono text-lg font-black text-butter">Come watch something with us.</p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link className={buttonVariants({ size: "lg" })} href="/screenings">
                See what’s screening
                <ArrowRight size={18} />
              </Link>
              <Link className={buttonVariants({ size: "lg", variant: "secondary" })} href="/about">
                Join the club
              </Link>
            </div>
          </div>
          <div className="mx-auto grid h-56 w-56 rotate-[-7deg] place-items-center rounded-full bg-butter p-7 text-center text-black shadow-soft lg:h-64 lg:w-64">
            <p className="scribble-logo text-3xl font-black uppercase leading-[0.95]">
              Every<br />Sunday<br />Afternoon<br />
              <span className="mt-2 block border-t-2 border-black pt-3 text-2xl">Your Sundays belong to us</span>
              <span className="mt-2 block text-3xl">⌣</span>
            </p>
          </div>
        </div>
      </section>

      <section className="torn-top relative bg-black">
        <div className="club-container grid gap-6 py-7 lg:grid-cols-[14rem_1fr] lg:items-start">
          <div className="pt-8">
            <h2 className="font-display text-4xl uppercase text-butter">Upcoming</h2>
            <p className="mt-5 font-mono text-sm leading-6 text-white">The next thing we have chosen to inflict upon ourselves, lovingly.</p>
            <Link className="mt-8 inline-flex items-center gap-3 font-display text-xl uppercase text-butter" href="/screenings">
              View all screenings
              <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {featured.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
