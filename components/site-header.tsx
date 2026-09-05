import Link from "next/link";
import { getCurrentScreening } from "@/lib/data";
import { publicAsset } from "@/lib/utils";
import { SiteNavigation } from "@/components/site-navigation";

// Screening data stays on the server; the navigation manages its disclosure.
export async function SiteHeader() {
  const current = await getCurrentScreening();

  return (
    <header className="bh-header bh-header--sticky">
      <div className="bh-header-inner">
        <Link className="bh-header-home" href="/">
          <img
            alt="Sunday Afternoon Bonk House"
            className="bh-header-logo"
            src={publicAsset("/bonkhouse-title.webp")}
          />
        </Link>
        <SiteNavigation
          rsvpHref={current ? `/events/${current.slug}` : "/#list"}
          rsvpLabel={current ? "RSVP" : "Join the list"}
        />
      </div>
    </header>
  );
}
