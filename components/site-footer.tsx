import Link from "next/link";
import { CircleEllipsis, MessageCircle, Play, Ticket } from "lucide-react";
import { publicAsset } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/15 bg-black text-ink">
      <div className="club-container grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr]">
        <div>
          <img
            alt="Sunday Afternoon Bonk House"
            className="h-auto w-56"
            src={publicAsset("/bonkhouse-title.png")}
          />
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/62">
            A Culver City excuse to watch movies together, with double features, trailers,
            neighborhood people, and just enough ceremony to make a Sunday feel official.
          </p>
        </div>
        <div>
          <p className="eyebrow">Clubhouse</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/72">
            <Link href="/screenings">Upcoming screenings</Link>
            <Link href="/photos">Photos</Link>
            <Link href="/merch">Merch</Link>
            <Link href="/about">About us</Link>
          </div>
        </div>
        <div>
          <p className="eyebrow">Follow us</p>
          <div className="mt-4 flex gap-3">
            {[MessageCircle, CircleEllipsis, Play].map((Icon, index) => (
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/25 text-butter" key={index}>
                <Icon size={18} />
              </span>
            ))}
          </div>
        </div>
        <div className="relative min-h-24 border border-butter/70 p-4 text-butter">
          <Ticket className="absolute right-4 top-4" size={28} />
          <p className="font-display text-2xl uppercase leading-none">Good films</p>
          <p className="font-display text-2xl uppercase leading-none">Good people</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em]">Admit one Sunday</p>
        </div>
      </div>
      <div className="club-container border-t border-white/10 py-4 text-center text-xs text-white/40">
        (c) 2026 Sunday Afternoon Bonkhouse. All rights reserved.
      </div>
    </footer>
  );
}
