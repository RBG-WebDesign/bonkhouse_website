import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { publicAsset } from "@/lib/utils";

const links = [
  { href: "/screenings", label: "Screenings" },
  { href: "/photos", label: "Photos" },
  { href: "/about", label: "About" }
];

export function SiteHeader() {
  return (
    <header className="grindhouse-header sticky top-0 z-50 border-b border-white/15 bg-black/90 backdrop-blur-xl">
      <div className="site-header-inner club-container flex min-h-20 items-center justify-between gap-4">
        <Link className="group block min-w-max" href="/">
          <img
            alt="Sunday Afternoon Bonk House"
            className="site-header-logo grindhouse-logo h-auto w-44 transition duration-200 group-hover:brightness-125 sm:w-56"
            src={publicAsset("/bonkhouse-title.png")}
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
          <Link className={buttonVariants({ className: "site-header-join h-12 px-6 font-bebas text-2xl tracking-wider leading-none", variant: "default" })} href="/screenings">
            JOIN THE CLUB
            <ArrowRight className="ml-1.5" size={16} />
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
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
