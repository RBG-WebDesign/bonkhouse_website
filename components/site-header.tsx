import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { publicAsset } from "@/lib/utils";

const links = [
  { href: "/screenings", label: "Screenings" },
  { href: "/photos", label: "Photos" },
  { href: "/about", label: "About" }
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
        <div className="flex items-center gap-8">
          <nav className="hidden items-center gap-8 lg:flex">
            {links.map((link) => (
              <Link
                className="inline-flex h-11 items-center text-xs font-black uppercase leading-none tracking-[0.05em] text-white transition hover:text-butter"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link className={buttonVariants({ className: "hidden h-11 leading-none sm:inline-flex", variant: "default" })} href="/screenings">
            JOIN THE CLUB
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}
