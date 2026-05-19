import type { BonkhouseEvent } from "@/types/bonkhouse";

export function PosterCard({ event }: { event: BonkhouseEvent }) {
  if (event.posterUrl) {
    return (
      <div className="relative mx-auto aspect-[555/740] w-full max-w-[34.7rem] overflow-hidden border border-white/25 bg-black shadow-soft">
        <img
          alt={`${event.title} poster`}
          className="absolute inset-0 h-full w-full object-cover"
          src={event.posterUrl}
        />
      </div>
    );
  }

  return (
    <div className="photo-frame photo-warm grain relative min-h-[26rem] overflow-hidden border border-white/25 bg-black p-5 shadow-soft">
      <div className="relative z-10 flex h-full min-h-[23rem] flex-col justify-between border border-white/30 bg-black/45 p-5 backdrop-blur-[1px]">
        <div>
          <p className="w-max rotate-[-2deg] border border-butter bg-black px-4 py-1 text-xs font-black uppercase text-butter">
            Sunday Afternoon
          </p>
          <h2 className="mt-8 max-w-sm font-display text-5xl uppercase leading-[0.92] text-white sm:text-6xl">
            {event.title}
          </h2>
        </div>
        <div>
          <p className="max-w-sm text-lg font-bold leading-6 text-white/82">{event.kicker}</p>
          <p className="mt-5 border-t border-white/20 pt-4 text-sm uppercase text-butter">
            {event.venue.neighborhood}
          </p>
        </div>
      </div>
    </div>
  );
}
