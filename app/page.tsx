import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
import { HeroShaderBackground } from "@/components/hero-shader-background";
import { MailingListForm } from "@/components/mailing-list-form";
import { buttonVariants } from "@/components/ui/button";
import { getEvents, getPhotos } from "@/lib/data";
import { formatEventTime, publicAsset } from "@/lib/utils";
import type { BonkhouseEvent } from "@/types/bonkhouse";

export default async function Home() {
  const events = await getEvents();
  const photos = await getPhotos();

  const upcoming = events.filter((event) => new Date(event.startsAt) >= new Date() && event.status !== "archived");
  const nextEvent = upcoming[0] || events[0];
  const heroEvent = makeHeroEvent(nextEvent);

  const pastEvents = events
    .filter((event) => event.status === "archived" || new Date(event.startsAt) < new Date())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 3);

  // Extract upcoming date parts
  const upcomingDate = new Date(heroEvent.startsAt);
  const upcomingMonth = upcomingDate.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const upcomingDay = upcomingDate.getDate();

  return (
    <div className="bg-black text-ink">
      {/* SECTION 1: HERO SECTION */}
      <section className="relative flex min-h-[44rem] items-center overflow-hidden bg-black py-16 lg:py-0">
        <HeroShaderBackground src="/hero/background-bonkhouse.png" />
        
        <div className="club-container relative z-10 grid w-full gap-8 lg:grid-cols-12">
          <div className="relative z-10 flex flex-col justify-center py-10 lg:col-span-8">
            <span aria-label="Welcome to" className="hero-handwritten-mark mb-1 self-start">
              {"Welcome to".split("").map((letter, index) => (
                <span
                  aria-hidden="true"
                  className={letter === " " ? "hero-handwritten-space" : undefined}
                  key={`${letter}-${index}`}
                >
                  {letter}
                </span>
              ))}
            </span>
            <h1 
              className="font-bebas text-7xl sm:text-8xl md:text-9xl leading-[0.8] tracking-[0.1em] select-none uppercase"
              style={{ WebkitTextStroke: "2px #ffd400", color: "transparent" }}
            >
              BONKHOUSE
            </h1>
            <p className="mt-6 max-w-2xl font-special text-[1.05rem] leading-[1.25] tracking-[0.015em] text-white sm:text-[1.35rem] md:text-[1.55rem]">
              A Sunday afternoon film thing for friends, freaks, and anyone who loves movies{" "}
              <span className="brush-underline text-butter">more than life itself</span>.
            </p>
            <p className="mt-4 max-w-xl text-sm text-white/70 leading-relaxed font-sans">
              As the empire falls, we gather before the screen to remember its visions: the films, trailers, and commercials that promised us what could have been.
            </p>
            
            <div className="mt-6 self-start dymo-tape-yellow text-[0.62rem] font-bold uppercase tracking-[0.08em] rotate-[1.5deg] shadow-md">
              Come watch something weird with us.
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link className={buttonVariants({ size: "lg", variant: "default" }) + " h-16 px-9 font-bebas text-xl tracking-wider sm:h-[4.25rem] sm:px-12 sm:text-2xl"} href="/screenings">
                SEE WHAT'S SCREENING →
              </Link>
              <Link className={buttonVariants({ size: "lg", variant: "secondary" }) + " h-16 border-butter/40 bg-black/40 px-9 font-bebas text-xl tracking-wider text-butter backdrop-blur sm:h-[4.25rem] sm:px-12 sm:text-2xl"} href="/about">
                JOIN THE CLUB
              </Link>
            </div>
          </div>

          {/* Right Column: Floating Free Screenings Sticker */}
          <div className="relative hidden items-center justify-center lg:col-span-4 lg:flex">
            <div
              aria-label="Dirty old sticker that says Your Sundays are belong to us"
              className="free-screenings-sticker h-56 w-56 rotate-[3deg] animate-float select-none"
            >
              <span className="sticker-grime sticker-grime-one" />
              <span className="sticker-grime sticker-grime-two" />
              <span className="sticker-slogan sticker-slogan-top">Your Sundays</span>
              <span className="sticker-slogan sticker-slogan-mid">are belong</span>
              <span className="sticker-slogan sticker-slogan-bottom">to us</span>
            </div>
          </div>
        </div>

        {/* Torn paper divider */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent via-black/32 to-black" />
          {/* Layer 1: White paper backing shadow */}
          <svg
            aria-hidden="true"
            className="relative block h-14 w-full fill-white/10 translate-y-[2px]"
            preserveAspectRatio="none"
            viewBox="0 0 1440 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 32L24 24L48 35L72 20L96 30L120 22L144 38L168 25L192 33L216 19L240 28L264 22L288 35L312 21L336 29L360 23L384 37L408 26L432 32L456 18L480 30L504 22L528 35L552 24L576 31L600 20L624 28L648 22L672 36L696 25L720 33L744 19L768 29L792 21L816 35L840 24L864 30L888 20L912 28L936 23L960 36L984 25L1008 32L1032 19L1056 29L1080 22L1104 35L1128 24L1152 31L1176 20L1200 28L1224 22L1248 36L1272 25L1296 33L1320 19L1344 28L1368 22L1392 35L1416 23L1440 30V48H0Z" />
          </svg>
          {/* Layer 2: Main black tear */}
          <svg
            aria-hidden="true"
            className="relative block h-14 w-full fill-black -mt-14 drop-shadow-[0_-8px_14px_rgba(0,0,0,0.45)]"
            preserveAspectRatio="none"
            viewBox="0 0 1440 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 32L24 24L48 35L72 20L96 30L120 22L144 38L168 25L192 33L216 19L240 28L264 22L288 35L312 21L336 29L360 23L384 37L408 26L432 32L456 18L480 30L504 22L528 35L552 24L576 31L600 20L624 28L648 22L672 36L696 25L720 33L744 19L768 29L792 21L816 35L840 24L864 30L888 20L912 28L936 23L960 36L984 25L1008 32L1032 19L1056 29L1080 22L1104 35L1128 24L1152 31L1176 20L1200 28L1224 22L1248 36L1272 25L1296 33L1320 19L1344 28L1368 22L1392 35L1416 23L1440 30V48H0Z" />
          </svg>
        </div>
      </section>

      {/* SECTION 2: UPCOMING SCREENING */}
      <section className="relative z-10 bg-black py-20">
        <div className="club-container grid gap-12 lg:grid-cols-[1.1fr_1.9fr] items-center">
          <div>
            <h2 className="font-bebas text-4xl sm:text-5xl text-butter tracking-wider uppercase border-b border-butter/25 pb-2 inline-block">
              Upcoming Screening
            </h2>
            <p className="mt-6 text-xl sm:text-2xl text-white/90 font-sans leading-relaxed">
              The next thing we have chosen to inflict upon ourselves, lovingly.
            </p>
            <div className="mt-8">
              <Link className={buttonVariants({ size: "lg", variant: "default" }) + " h-16 px-9 font-bebas text-xl tracking-wider sm:h-[4.25rem] sm:px-12 sm:text-2xl"} href="/screenings">
                SEE WHAT'S SCREENING →
              </Link>
            </div>
          </div>

          {/* Double-feature Card Ticket Flyer */}
          <div className="relative p-6 bg-[#dfdacb] border border-[#c3bba6] shadow-sticker rounded-[3px] text-black overflow-visible flex min-h-[17rem] md:min-h-[20rem] select-none hover:-translate-y-1 transition duration-300">
            {/* Ticket Punches */}
            <div className="ticket-punch-left" />
            <div className="ticket-punch-right" />

            {/* Translucent Corner Tapes */}
            <div className="ticket-tape -top-2 -left-8 rotate-[-35deg]" />
            <div className="ticket-tape -top-2 -right-8 rotate-[35deg]" />
            <div className="ticket-tape -bottom-2 -left-8 rotate-[35deg]" />
            <div className="ticket-tape -bottom-2 -right-8 rotate-[-35deg]" />

            {/* Subtle paper grid overlay (clipped to rounded corners) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:14px_14px] rounded-[3px] overflow-hidden" />

            {/* Date Stamp Column */}
            <div className="flex flex-col justify-center items-center pr-6 border-r border-dashed border-[#c5bead] select-none z-10">
              <span className="font-sans font-black text-xs tracking-widest text-[#a83428] uppercase">{upcomingMonth}</span>
              <span className="font-special text-5xl md:text-6xl font-bold tracking-tight text-black leading-none mt-1">{upcomingDay}</span>
            </div>

            {/* Ticket Info Area */}
            <div className="flex-1 pl-6 flex flex-col justify-between relative z-10">
              {heroEvent.slug === "society-videodrome-double-feature" ? (
                <>
                  {/* Subtle graphics collage bg (clipped to rounded corners) */}
                  <div className="absolute inset-0 flex justify-between items-center opacity-[0.28] pointer-events-none rounded-[3px] overflow-hidden select-none">
                    {/* Melting body profile left */}
                    <div className="w-24 h-24 rounded-full bg-[#b22e1e] blur-md translate-x-[-12px] opacity-70" />
                    {/* Retro TV box right */}
                    <div className="w-20 h-16 border-2 border-black rounded flex items-center justify-center rotate-6 translate-x-[15px] bg-black/5">
                      <div className="w-14 h-10 border border-black rounded-full bg-white/30 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-black/85" />
                      </div>
                    </div>
                  </div>

                  {/* Flyer Title Text */}
                  <div className="py-3 flex flex-col justify-center items-center h-full">
                    <p className="font-sans font-black text-[0.62rem] tracking-[0.2em] uppercase text-black/60">
                      SUNDAY AFTERNOON DOUBLE FEATURE
                    </p>
                    <h3 className="font-bebas text-4xl sm:text-5xl md:text-6xl tracking-wide leading-[0.9] text-black text-center mt-2 font-black">
                      SOCIETY + VIDEODROME
                    </h3>
                    <div className="mt-3.5 flex flex-col items-center gap-1.5 w-full">
                      {/* Yellow Dymo Tape Badge */}
                      <span className="dymo-tape-yellow text-[0.6rem] font-bold uppercase tracking-wider rotate-[-1deg] shadow-md select-none">
                        BODY HORROR DOUBLE FEATURE
                      </span>
                      {/* Red Dymo Tape Badge */}
                      <span className="dymo-tape text-[0.6rem] font-bold uppercase tracking-wider rotate-[0.5deg] shadow-md select-none">
                        DISCUSSION TO FOLLOW, WHETHER YOU WANT IT OR NOT
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* Dynamic fallback for other screenings */
                <div className="py-3 flex flex-col justify-center h-full">
                  <p className="font-sans font-black text-[0.62rem] tracking-[0.2em] uppercase text-black/60">
                    SUNDAY AFTERNOON SCREENING
                  </p>
                  <h3 className="font-bebas text-3xl sm:text-4xl tracking-wide leading-none text-black mt-2 uppercase">
                    {heroEvent.title}
                  </h3>
                  <p className="font-sans text-xs text-black/85 mt-2 line-clamp-2 leading-relaxed">
                    {heroEvent.description}
                  </p>
                  <div className="mt-4">
                    <span className="dymo-tape-yellow text-[0.6rem] font-bold uppercase tracking-wider rotate-[-1deg] shadow-md">
                      {heroEvent.kicker || "RSVP OPEN"}
                    </span>
                  </div>
                </div>
              )}

              {/* Flyer Bottom Bar */}
              <div className="border-t border-[#c5bead] pt-3 flex justify-between items-center text-[0.62rem] font-black uppercase tracking-widest text-black/60 font-sans">
                <span>DOORS: {formatEventTime(heroEvent.doorsAt)}</span>
                <span>VENUE: {heroEvent.venue.name}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: PAST SCREENINGS */}
      <section className="relative z-10 bg-black py-20 border-t border-white/10">
        <div className="club-container">
          <h2 className="font-bebas text-4xl sm:text-5xl text-butter tracking-wider uppercase border-b border-butter/25 pb-2 inline-block">
            Past Screenings
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {pastEvents.map((event, index) => {
              const eventDate = new Date(event.startsAt);
              const eventMonth = eventDate.toLocaleString("en-US", { month: "short" }).toUpperCase();
              const eventDay = eventDate.getDate();

              return (
                <div 
                  key={event.id}
                  className="relative p-5 bg-[#dfdacb] border border-[#c3bba6] shadow-sticker rounded-[3px] text-black overflow-visible flex flex-col justify-between min-h-[14rem] select-none hover:-translate-y-1 transition duration-300"
                  style={{ transform: `rotate(${(index % 2 === 0 ? -1.2 : 0.8) * 0.8}deg)` }}
                >
                  {/* Ticket Punches */}
                  <div className="ticket-punch-left" />
                  <div className="ticket-punch-right" />

                  {/* Paper taped corners */}
                  <div className="ticket-tape -top-2 left-6 rotate-[12deg] w-20 opacity-90" />
                  <div className="ticket-tape -bottom-2 right-8 rotate-[-8deg] w-20 opacity-90" />

                  {/* Stamp style date */}
                  <div className="absolute top-3 left-3 bg-[#f2ede0] border border-black/10 px-2 py-0.5 text-center rounded-[2px] shadow-sm select-none z-10">
                    <div className="font-sans font-black text-[0.6rem] text-[#a83428] leading-none">{eventMonth}</div>
                    <div className="font-special text-2xl font-bold text-black leading-none mt-0.5">{eventDay}</div>
                  </div>

                  {/* Poster Graphic blended onto paper texture (clipped to rounded ticket) */}
                  <div className="absolute inset-0 rounded-[3px] overflow-hidden pointer-events-none z-0">
                    {event.posterUrl && (
                      <div 
                        className="absolute inset-0 opacity-[0.24] mix-blend-multiply bg-center bg-cover bg-no-repeat grayscale"
                        style={{ backgroundImage: `url(${publicAsset(event.posterUrl)})` }}
                      />
                    )}
                  </div>

                  {/* Screening Title */}
                  <div className="flex-1 flex flex-col justify-center items-center text-center pt-8 px-2 z-10">
                    <h4 className="font-bebas text-2xl sm:text-3xl tracking-wide leading-[0.95] text-black font-black uppercase">
                      {event.title
                        .replace("Sunday Afternoon Bonkhouse ", "")
                        .replace("Bonkhouse and House Pardee Present: ", "")
                        .replace("Sunday Afternoon Bonkhouse Presents ", "")
                        .replace(" Creature Double Feature", " Creature")
                        .replace(" Double Feature", "")}
                    </h4>
                  </div>

                  {/* Dymo-style Tape badge */}
                  <div className="flex justify-center mt-3 z-10">
                    <span className={`${
                      index === 0 ? "bg-[#1f5436] text-white" :
                      index === 1 ? "bg-[#9d251a] text-white" :
                      "bg-[#214b73] text-white"
                    } font-special px-3 py-1 text-[0.55rem] font-bold uppercase tracking-wider rotate-[0.8deg] shadow-md select-none border border-black/10 rounded-[1.5px] inset-y-shadow`}>
                      {index === 0 ? "DOUBLE FEATURE" : index === 1 ? "DISCUSSION TO FOLLOW" : "PRIVATE SCREENING"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link className={buttonVariants({ size: "lg", variant: "default" }) + " h-16 px-9 font-bebas text-xl tracking-wider sm:h-[4.25rem] sm:px-12 sm:text-2xl"} href="/screenings">
              SEE ALL PAST SCREENINGS →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: PHOTOS */}
      <section className="relative z-10 bg-black py-20 border-t border-white/10">
        <div className="club-container">
          <h2 className="font-bebas text-4xl sm:text-5xl text-butter tracking-wider uppercase border-b border-butter/25 pb-2 inline-block">
            Photos
          </h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {photos.slice(0, 3).map((photo, index) => (
              <div 
                key={photo.id}
                className="polaroid-frame select-none"
                style={{ transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (index + 1) * 1.5}deg)` }}
              >
                {/* Polaroid Film Stock Image Area */}
                <div className="aspect-square bg-[#101010] overflow-hidden border border-black/5 relative">
                  {/* Subtle noise/grain texture */}
                  <div className="absolute inset-0 bg-noise opacity-[0.08] pointer-events-none z-10" />
                  
                  {photo.imageUrl ? (
                    <img 
                      alt={photo.caption}
                      className="w-full h-full object-cover grayscale transition duration-300 hover:grayscale-0"
                      src={publicAsset(photo.imageUrl)}
                    />
                  ) : (
                    /* Polaroid camera icon fallback if image is empty */
                    <div className="w-full h-full flex flex-col justify-center items-center text-white/20 p-4 text-center select-none bg-zinc-950">
                      <Camera size={36} strokeWidth={1.5} className="text-zinc-800" />
                      <span className="text-[0.6rem] font-mono tracking-widest mt-2.5 uppercase text-zinc-700">{photo.eventTitle || "SUNDAY AFTERNOON"}</span>
                    </div>
                  )}
                </div>
                {/* Polaroid signature caption */}
                <div className="pt-4 text-center">
                  <p className="font-hand text-[1.6rem] text-black/80 font-black tracking-tight leading-none rotate-[-0.5deg]">
                    {photo.caption}
                  </p>
                  <p className="text-[0.55rem] font-mono uppercase tracking-wider text-black/40 mt-2 font-black select-none">
                    {photo.shotAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: ABOUT US */}
      <section className="relative z-10 bg-black py-20 border-t border-white/10">
        <div className="club-container">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] items-start">
            <div>
              <h2 className="font-bebas text-4xl sm:text-5xl text-butter tracking-wider uppercase border-b border-butter/25 pb-2 inline-block">
                About Us
              </h2>
              <p className="mt-6 text-xl sm:text-2xl text-white font-sans leading-snug">
                A Culver City film social club for people who gather around a screen and let a movie do what movies do best.
              </p>
            </div>
            
            <div className="text-white/70 font-sans text-sm sm:text-base leading-8 space-y-6">
              <p>
                Sunday Afternoon Bonkhouse grew out of five years of friends coming together to make movie nights feel handmade. We cut old trailers, commercials, videos, shorts, animations, and art from people we love into custom programs that turn a double feature into its own strange little event.
              </p>
              <p>
                People come for the movies, but they also come for the original pieces, the surprises, and the bits that only exist because someone in the room made them.
              </p>
              <p>
                We meet at the Gloria Kaufman Community Center side gate in Culver City. Our screenings feature trailers, intermissions, post-show lobby chatter, and a room full of friendly movie lovers. Come watch something with us.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAILING LIST SECTION (FOOTER SIGNUP) */}
      <section className="relative z-10 bg-zinc-950/40 py-16 border-t border-white/10">
        <div className="club-container max-w-xl text-center">
          <MailingListForm />
        </div>
      </section>
    </div>
  );
}

function makeHeroEvent(event: BonkhouseEvent): BonkhouseEvent {
  return {
    ...event,
    id: "society-videodrome-double-feature",
    slug: "society-videodrome-double-feature",
    title: "Society / Videodrome Double Feature",
    kicker: "Bryan Yuzna's Society meets Videodrome for a body-horror Sunday.",
    description:
      "A neighborhood body-horror movie afternoon with a pre-show, Society, intermission, Videodrome, and enough lobby chatter to make leaving immediately feel rude.",
    posterUrl: "/posters/society-videodrome-double-feature.svg",
    program: ["Pre-show trailers", "Society", "Intermission ads", "Videodrome"]
  };
}
