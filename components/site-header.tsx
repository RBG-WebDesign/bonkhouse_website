import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { publicAsset } from "@/lib/utils";

const links = [
  { href: "/screenings", label: "Screenings" },
  { href: "/photos", label: "Journal" },
  { href: "/merch", label: "Membership" },
  { href: "/about", label: "About" },
  { href: "/about", label: "Contact" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/15 bg-black/90 backdrop-blur-xl">
      <div className="club-container flex min-h-20 items-center justify-between gap-4">
        <Link className="group block min-w-max" href="/">
          <img
            alt="Sunday Afternoon Bonk House"
            className="h-auto w-44 transition duration-200 group-hover:brightness-125 sm:w-56"
            src={publicAsset("/bonkhouse-title.png")}
          />
        </Link>
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              className="text-xs font-black uppercase tracking-[0.03em] text-white transition hover:text-butter"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className={buttonVariants({ className: "hidden sm:inline-flex", variant: "default" })} href="/screenings">
          Join the club
          <ArrowRight size={16} />
        </Link>
      </div>
    </header>
  );
}
