"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

const links = [
  { href: "/screenings", label: "Screenings" },
  { href: "/about", label: "About" }
];

type SiteNavigationProps = { rsvpHref: string; rsvpLabel: string };

export function SiteNavigation(props: SiteNavigationProps) {
  const pathname = usePathname();
  return <NavigationDisclosure {...props} key={pathname} pathname={pathname} />;
}

function NavigationDisclosure({ pathname, rsvpHref, rsvpLabel }: SiteNavigationProps & { pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const actionsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 900px)");
    function onBreakpointChange(event: { matches: boolean }) {
      if (event.matches) setMenuOpen(false);
    }

    // Subscribe for the disclosure's lifetime so opening and resizing cannot
    // race the effect that handles outside clicks.
    desktop.addEventListener("change", onBreakpointChange);
    onBreakpointChange(desktop);
    return () => desktop.removeEventListener("change", onBreakpointChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    }

    function onOutsideInteraction(event: Event) {
      if (event.target instanceof Node && !actionsRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onOutsideInteraction);
    document.addEventListener("focusin", onOutsideInteraction);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onOutsideInteraction);
      document.removeEventListener("focusin", onOutsideInteraction);
    };
  }, [menuOpen]);

  function isActive(href: string) {
    return pathname === href || (href === "/screenings" && pathname.startsWith("/events/"));
  }

  function navigationLinks() {
    return links.map((link) => (
      <Link
        aria-current={isActive(link.href) ? "page" : undefined}
        className="bh-header-link"
        href={link.href}
        key={link.href}
        onClick={() => setMenuOpen(false)}
      >
        {link.label}
      </Link>
    ));
  }

  return (
    <div className="bh-header-actions" ref={actionsRef}>
      <nav aria-label="Main navigation" className="bh-header-nav">
        {navigationLinks()}
      </nav>
      <Link className="bh-header-cta bh-header-cta--standalone" href={rsvpHref} onClick={() => setMenuOpen(false)}>
        {rsvpLabel}
        <ArrowRight aria-hidden="true" size={16} strokeWidth={2.5} />
      </Link>
      <button
        aria-controls={menuId}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        className="bh-header-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        ref={buttonRef}
        type="button"
      >
        {menuOpen ? <X aria-hidden="true" size={28} strokeWidth={2.4} /> : <Menu aria-hidden="true" size={28} strokeWidth={2.4} />}
      </button>
      <nav aria-label="Site menu" className="bh-header-menu" hidden={!menuOpen} id={menuId}>
        {navigationLinks()}
        <Link className="bh-header-cta" href={rsvpHref} onClick={() => setMenuOpen(false)}>
          {rsvpLabel}
          <ArrowRight aria-hidden="true" size={18} strokeWidth={2.5} />
        </Link>
      </nav>
    </div>
  );
}
