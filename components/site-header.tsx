import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { publicAsset } from "@/lib/utils";

const links = [
  { href: "/screenings", label: "Screenings" },
  { href: "/about", label: "About" }
];

export function SiteHeader() {
  return (
    <header className="grindhouse-header sticky top-0 z-50 border-b border-white/15 bg-black/90 backdrop-blur-xl">
      <div className="site-header-inner club-container flex min-h-20 items-center justify-between gap-4">
        <Link className="group block min-w-max" href="/">
          <img
            alt="Sunday Afternoon Bonk House"
            className="site-header-logo grindhouse-logo h-[52px] w-auto transition duration-200 group-hover:brightness-125"
            src={publicAsset("/bonkhouse-title.webp")}
          />
        </Link>
        <div className="site-header-actions flex items-center gap-8">
          <nav className="hidden items-center gap-8 lg:flex">
            {links.map((link) => (
              <Link
                className="inline-flex h-11 items-center font-bebas text-2xl uppercase tracking-wider text-white transition duration-200 hover:text-butter hover:scale-105"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            className="site-header-join relative hidden h-12 items-center justify-center gap-2 rounded-[3px] lg:inline-flex border border-butter bg-butter px-6 font-bebas text-2xl uppercase tracking-wider leading-none text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-8px_18px_rgba(83,51,0,0.14),0_8px_22px_rgba(0,0,0,0.32),0_0_26px_rgba(255,212,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#ffe15a]"
            href="/events/society-videodrome-double-feature"
          >
            RSVP
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <details className="site-header-mobile-menu lg:hidden">
            <summary aria-label="Open menu" className="site-header-menu">
              <Menu size={40} strokeWidth={2.4} />
            </summary>
            <div className="site-header-mobile-panel">
              {links.map((link) => (
                <Link className="site-header-mobile-link" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
              <Link className="site-header-mobile-link site-header-mobile-rsvp" href="/events/society-videodrome-double-feature">
                RSVP
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
