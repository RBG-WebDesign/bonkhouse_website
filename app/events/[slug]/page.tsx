import { CalendarDays, Clock, DoorOpen, MapPin, MessageCircle } from "lucide-react";
import { PosterCard } from "@/components/poster-card";
import { RsvpForm } from "@/components/rsvp-form";
import { Badge } from "@/components/ui/badge";
import { getEventBySlug } from "@/lib/data";
import { sampleEvents } from "@/lib/sample-data";
import { formatEventDate, formatEventTime, formatEventTimeRange } from "@/lib/utils";

export function generateStaticParams() {
  return sampleEvents.map((event) => ({ slug: event.slug }));
}

export default async function EventDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return (
      <div className="club-container py-10">
        <p className="eyebrow">Screening</p>
        <h1 className="font-display text-6xl uppercase leading-none tracking-[-0.06em] text-white">
          Screening not found
        </h1>
      </div>
    );
  }

  const archived = event.status === "archived" || new Date(event.startsAt) < new Date();

  return (
    <div className="club-container grid gap-8 py-10 lg:grid-cols-[0.92fr_1.08fr]">
      <PosterCard event={event} />
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge className={archived ? "border-sage/60 text-sage" : "border-butter/60 text-butter"}>
            {archived ? "Past screening" : "RSVP open"}
          </Badge>
          <Badge>{event.capacityStandard} seats + {event.capacityOverflow} overflow</Badge>
        </div>
        <h1 className="mt-5 font-display text-6xl uppercase leading-none tracking-[-0.06em] text-white">{event.title}</h1>
        <p className="mt-5 text-lg leading-8 text-white/70">{event.description}</p>

        <div className="club-card mt-8 grid gap-3 rounded-lg p-5">
          {[
            [CalendarDays, "Date", formatEventDate(event.startsAt)],
            [DoorOpen, "Doors", formatEventTime(event.doorsAt)],
            [Clock, "Screening", formatEventTimeRange(event.startsAt, event.endsAt)],
            [MapPin, "Venue", `${event.venue.name}, ${event.venue.address}`],
            [MessageCircle, "Late arrival", event.textForEntry]
          ].map(([Icon, label, value]) => {
            const IconComponent = Icon as typeof CalendarDays;
            return (
              <div className="grid gap-2 border-b border-white/[0.12] pb-3 last:border-0 last:pb-0 sm:grid-cols-[9rem_1fr]" key={label as string}>
                <p className="inline-flex items-center gap-2 text-sm font-black uppercase text-butter">
                  <IconComponent size={17} />
                  {label as string}
                </p>
                <p className="font-bold text-white/78">{value as string}</p>
              </div>
            );
          })}
        </div>

        <section className="mt-8 border border-butter/60 bg-black p-5">
          <h2 className="font-display text-4xl uppercase text-white">Program</h2>
          <ol className="mt-4 grid gap-3">
            {event.program.map((item, index) => (
              <li className="rounded-md border border-white/18 bg-white/[0.04] px-4 py-3 font-bold text-white/78" key={item}>
                {index + 1}. {item}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8 grid gap-4">
          <div className="club-card rounded-lg p-5">
            <h2 className="font-display text-3xl uppercase text-white">Arrival notes</h2>
            <p className="mt-3 leading-7 text-white/70">{event.venue.entryInstructions}</p>
            <p className="mt-3 leading-7 text-white/70">{event.hostNote}</p>
            <p className="mt-3 text-sm font-bold text-butter">{event.accessibilityNote}</p>
          </div>
          {archived ? null : <RsvpForm eventId={event.id} />}
        </section>
      </div>
    </div>
  );
}
