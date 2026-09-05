"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type EventRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  kicker?: string | null;
  description?: string | null;
  poster_url?: string | null;
  poster_alt_url?: string | null;
  logo_url?: string | null;
  venues?: { name?: string | null; address?: string | null } | null;
  starts_at?: string | null;
  ends_at?: string | null;
  doors_at?: string | null;
  gate_closes_at?: string | null;
  rsvp_opens_at?: string | null;
  rsvp_closes_at?: string | null;
  capacity_standard?: number | null;
  capacity_overflow?: number | null;
  max_tickets_per_rsvp?: number | null;
  status?: string | null;
  program?: string[] | null;
  entry_instructions?: string | null;
  host_note?: string | null;
  accessibility_note?: string | null;
  admin_notes?: string | null;
};

const LA = "America/Los_Angeles";

// Events happen in LA. Inputs are read as LA wall-clock time and stored with
// the correct UTC offset for that date (handles PDT vs PST).
function laOffset(dateLike: string) {
  const probe = new Date(`${dateLike}T12:00:00Z`);
  const label = new Intl.DateTimeFormat("en-US", { timeZone: LA, timeZoneName: "longOffset" }).format(probe);
  const match = label.match(/GMT([+-]\d{2}:\d{2})/);
  return match ? match[1] : "-08:00";
}

function toIso(date: string, time: string) {
  if (!date || !time) return "";
  return `${date}T${time}:00${laOffset(date)}`;
}

function isoToLaParts(iso?: string | null) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function ImageField({
  label,
  name,
  initialUrl
}: {
  label: string;
  name: string;
  initialUrl?: string | null;
}) {
  const [url, setUrl] = useState(initialUrl || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Upload failed.");
      setUrl(payload.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error && uploadError.message ? uploadError.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[1.2rem] border-2 border-ink bg-paper p-4">
      <p className="text-xs font-black uppercase">{label}</p>
      <input name={name} type="hidden" value={url} />
      {url ? (
        <img alt={`${label} preview`} className="mt-3 max-h-44 rounded-lg border border-ink/20" src={url} />
      ) : (
        <p className="mt-2 text-sm">No image yet.</p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <Button
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          size="sm"
          type="button"
          variant="secondary"
        >
          {busy ? "Uploading…" : url ? "Replace image" : "Upload image"}
        </Button>
        {url ? (
          <Button onClick={() => setUrl("")} size="sm" type="button" variant="ghost">
            Remove
          </Button>
        ) : null}
      </div>
      <input
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      {error ? <p className="mt-2 text-sm font-bold text-cherry">{error}</p> : null}
    </div>
  );
}

function DateTimeField({
  label,
  namePrefix,
  initialIso,
  required
}: {
  label: string;
  namePrefix: string;
  initialIso?: string | null;
  required?: boolean;
}) {
  const initial = isoToLaParts(initialIso);
  return (
    <label className="grid gap-1.5 rounded-xl border border-ink/25 bg-paper/60 p-3 text-[0.65rem] font-black uppercase tracking-wider text-ink/70">
      {label}
      <span className="grid grid-cols-[1.4fr_1fr] gap-2">
        <input
          className="focus-ring min-w-0 rounded-lg border-2 border-ink bg-paper px-3 py-2 text-sm font-bold normal-case tracking-normal text-ink"
          defaultValue={initial.date}
          name={`${namePrefix}Date`}
          required={required}
          type="date"
        />
        <input
          className="focus-ring min-w-0 rounded-lg border-2 border-ink bg-paper px-3 py-2 text-sm font-bold normal-case tracking-normal text-ink"
          defaultValue={initial.time}
          name={`${namePrefix}Time`}
          required={required}
          type="time"
        />
      </span>
    </label>
  );
}

const field = "focus-ring rounded-full border-2 border-ink bg-paper px-4 py-3";
const area = "focus-ring rounded-[1.2rem] border-2 border-ink bg-paper px-4 py-3";

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mt-4 border-t border-ink/20 pt-4">
      <p className="font-display text-xl tracking-wide text-butter">{title}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink/60">{hint}</p> : null}
    </div>
  );
}

export function AdminEventForm({ event }: { event?: EventRecord }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(event));
  const slugRef = useRef<HTMLInputElement>(null);

  async function submit(formData: FormData) {
    if (saving) return;
    setSaving(true);
    setMessage("");

    const value = (name: string) => String(formData.get(name) || "");
    const dt = (prefix: string) => toIso(value(`${prefix}Date`), value(`${prefix}Time`));

    // A date without a time (or vice versa) would silently save as nothing —
    // stop and ask instead.
    const pairLabels: Record<string, string> = {
      doors: "Doors open",
      starts: "Screening starts",
      ends: "Screening ends",
      gateCloses: "Gate closes",
      rsvpOpens: "RSVPs open",
      rsvpCloses: "RSVPs close"
    };
    const halfFilled = Object.entries(pairLabels)
      .filter(([prefix]) => Boolean(value(`${prefix}Date`)) !== Boolean(value(`${prefix}Time`)))
      .map(([, label]) => label);
    if (halfFilled.length) {
      setMessage(`Fill in both the date and the time for: ${halfFilled.join(", ")} (or clear both).`);
      setSaving(false);
      return;
    }

    const payload = {
      title: value("title"),
      slug: value("slug"),
      subtitle: value("subtitle"),
      badge: value("badge"),
      kicker: value("kicker"),
      description: value("description"),
      posterUrl: value("posterUrl"),
      posterAltUrl: value("posterAltUrl"),
      logoUrl: value("logoUrl"),
      venueName: value("venueName"),
      venueAddress: value("venueAddress"),
      startsAt: dt("starts"),
      endsAt: dt("ends"),
      doorsAt: dt("doors"),
      gateClosesAt: dt("gateCloses"),
      rsvpOpensAt: dt("rsvpOpens"),
      rsvpClosesAt: dt("rsvpCloses"),
      capacityStandard: value("capacityStandard"),
      capacityOverflow: value("capacityOverflow"),
      maxTicketsPerRsvp: value("maxTicketsPerRsvp"),
      status: value("status"),
      program: value("program"),
      entryInstructions: value("entryInstructions"),
      hostNote: value("hostNote"),
      accessibilityNote: value("accessibilityNote"),
      adminNotes: value("adminNotes")
    };

    try {
      const response = await fetch(event ? `/api/admin/events/${event.id}` : "/api/admin/events", {
        method: event ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save the event.");
      setMessage(event ? "Saved." : `Created ${result.title}.`);
      router.refresh();
      if (!event && result.id) {
        router.push(`/admin/events/${result.id}`);
      }
    } catch (saveError) {
      setMessage(saveError instanceof Error && saveError.message ? saveError.message : "Could not save the event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={submit} className="rounded-[1.4rem] border-2 border-ink bg-white/10 p-5 text-ink shadow-sticker">
      <p className="font-display text-3xl">{event ? "Edit screening" : "Create screening"}</p>
      <div className="mt-5 grid gap-3">
        <input
          className={field}
          defaultValue={event?.title || ""}
          name="title"
          onChange={(e) => {
            if (!slugTouched && slugRef.current) {
              slugRef.current.value = slugify(e.target.value);
            }
          }}
          placeholder="Title"
          required
        />
        <input className={field} defaultValue={event?.subtitle || ""} name="subtitle" placeholder="Short title for the ticket, e.g. SOCIETY + VIDEODROME (optional)" />
        <input className={field} defaultValue={event?.badge || ""} name="badge" placeholder="Ticket tag, e.g. BODY HORROR DOUBLE FEATURE (optional)" />
        <label className="grid gap-1 text-xs font-black uppercase">
          Web address (bonkhouse.com/events/…)
          <input
            className={`${field} normal-case`}
            defaultValue={event?.slug || ""}
            name="slug"
            onChange={() => setSlugTouched(true)}
            placeholder="url-slug"
            ref={slugRef}
            required
          />
        </label>
        <input className={field} defaultValue={event?.kicker || ""} name="kicker" placeholder="One-line teaser shown under the title" />
        <textarea className={`${area} min-h-24`} defaultValue={event?.description || ""} name="description" placeholder="Description" />

        <SectionHeading hint="Poster fills the homepage hero and event page; the second poster, if set, alternates with it. The logo sits on the ticket above the short title — upload a trimmed transparent PNG." title="Artwork" />
        <div className="grid gap-3 sm:grid-cols-3">
          <ImageField initialUrl={event?.poster_url} label="Poster" name="posterUrl" />
          <ImageField initialUrl={event?.poster_alt_url} label="Second poster (optional)" name="posterAltUrl" />
          <ImageField initialUrl={event?.logo_url} label="Event logo (optional)" name="logoUrl" />
        </div>

        <SectionHeading hint="Shown on the site and in ticket emails. A new name creates a new venue." title="Venue" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={field}
            defaultValue={event ? event.venues?.name || "" : "Glorya Kaufman Community Center"}
            name="venueName"
            placeholder="Venue name"
            required
          />
          <input
            className={field}
            defaultValue={event ? event.venues?.address || "" : "10858 Culver Blvd, Culver City, CA"}
            name="venueAddress"
            placeholder="Address"
          />
        </div>

        <SectionHeading hint="All times are Los Angeles time." title="Schedule" />
        <div className="grid gap-3 sm:grid-cols-2">
          <DateTimeField initialIso={event?.doors_at} label="Doors open" namePrefix="doors" required />
          <DateTimeField initialIso={event?.starts_at} label="Screening starts" namePrefix="starts" required />
          <DateTimeField initialIso={event?.ends_at} label="Screening ends" namePrefix="ends" />
          <DateTimeField initialIso={event?.gate_closes_at} label="Gate closes" namePrefix="gateCloses" />
        </div>

        <SectionHeading hint="Leave blank to keep RSVPs open until the gate closes." title="RSVP window" />
        <div className="grid gap-3 sm:grid-cols-2">
          <DateTimeField initialIso={event?.rsvp_opens_at} label="RSVPs open" namePrefix="rsvpOpens" />
          <DateTimeField initialIso={event?.rsvp_closes_at} label="RSVPs close" namePrefix="rsvpCloses" />
        </div>

        <SectionHeading hint="Standard fills first, then overflow, then the waitlist starts." title="Capacity" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Standard seats", "capacityStandard", event?.capacity_standard ?? 80, 0, undefined],
            ["Overflow seats", "capacityOverflow", event?.capacity_overflow ?? 20, 0, undefined],
            ["Max per RSVP", "maxTicketsPerRsvp", event?.max_tickets_per_rsvp ?? 4, 1, 10]
          ].map(([label, name, value, min, max]) => (
            <label
              className="grid gap-1.5 rounded-xl border border-ink/25 bg-paper/60 p-3 text-[0.65rem] font-black uppercase tracking-wider text-ink/70"
              key={String(name)}
            >
              {label}
              <input
                className="focus-ring min-w-0 rounded-lg border-2 border-ink bg-paper px-3 py-2 text-center font-display text-2xl normal-case tracking-normal text-ink"
                defaultValue={Number(value)}
                max={max as number | undefined}
                min={min as number}
                name={String(name)}
                type="number"
              />
            </label>
          ))}
        </div>

        <SectionHeading hint="One item per line, shown in order on the event page." title="Program" />
        <textarea
          className={`${area} min-h-24`}
          defaultValue={(event?.program || []).join("\n")}
          name="program"
          placeholder={"Pre-show trailers\nFeature one\nIntermission\nFeature two"}
        />
        <SectionHeading hint="Gate instructions go in the confirmation email; notes appear on the event page." title="Notes" />
        <textarea className={`${area} min-h-20`} defaultValue={event?.entry_instructions || ""} name="entryInstructions" placeholder="How guests get in (gate instructions)" />
        <textarea className={`${area} min-h-16`} defaultValue={event?.host_note || ""} name="hostNote" placeholder="Host note (optional)" />
        <textarea className={`${area} min-h-16`} defaultValue={event?.accessibility_note || ""} name="accessibilityNote" placeholder="Accessibility note (optional)" />
        <textarea className={`${area} min-h-16`} defaultValue={event?.admin_notes || ""} name="adminNotes" placeholder="Private team notes (never shown to guests)" />

        <SectionHeading
          hint="The soonest published screening is the current one everywhere on the site. Six hours after showtime it moves to Past Screenings on its own."
          title="Visibility"
        />
        <label className="grid gap-1 text-xs font-black uppercase">
          Status
          <select className={`${field} normal-case`} defaultValue={event?.status || "draft"} name="status">
            <option value="draft">Draft — hidden from the public site</option>
            <option value="published">Published — live on the site, taking RSVPs during the RSVP window</option>
            <option value="cancelled">Cancelled — hidden from the public site, RSVPs closed</option>
            <option value="archived">Archived — shown as a past screening</option>
          </select>
        </label>
      </div>
      <Button className="mt-5" disabled={saving} type="submit">
        {saving ? "Saving…" : event ? "Save changes" : "Create event"}
      </Button>
      {message ? <p className="mt-4 text-sm font-bold">{message}</p> : null}
    </form>
  );
}
