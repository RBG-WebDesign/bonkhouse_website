"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type EventRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  kicker?: string | null;
  description?: string | null;
  poster_url?: string | null;
  logo_url?: string | null;
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
    } catch (uploadError: any) {
      setError(uploadError.message || "Upload failed.");
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
    <label className="grid gap-1 text-xs font-black uppercase">
      {label}
      <span className="flex gap-2">
        <input
          className="focus-ring w-full rounded-full border-2 border-ink bg-paper px-3 py-2 text-sm font-bold normal-case"
          defaultValue={initial.date}
          name={`${namePrefix}Date`}
          required={required}
          type="date"
        />
        <input
          className="focus-ring w-full rounded-full border-2 border-ink bg-paper px-3 py-2 text-sm font-bold normal-case"
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

    const payload = {
      title: value("title"),
      slug: value("slug"),
      subtitle: value("subtitle"),
      kicker: value("kicker"),
      description: value("description"),
      posterUrl: value("posterUrl"),
      logoUrl: value("logoUrl"),
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
    } catch (saveError: any) {
      setMessage(saveError.message || "Could not save the event.");
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
        <input className={field} defaultValue={event?.subtitle || ""} name="subtitle" placeholder="Subtitle (optional)" />
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

        <div className="grid gap-3 sm:grid-cols-2">
          <ImageField initialUrl={event?.poster_url} label="Poster" name="posterUrl" />
          <ImageField initialUrl={event?.logo_url} label="Event logo (optional)" name="logoUrl" />
        </div>

        <p className="mt-2 text-xs font-black uppercase">Schedule (Los Angeles time)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <DateTimeField initialIso={event?.doors_at} label="Doors open" namePrefix="doors" required />
          <DateTimeField initialIso={event?.starts_at} label="Screening starts" namePrefix="starts" required />
          <DateTimeField initialIso={event?.ends_at} label="Screening ends" namePrefix="ends" />
          <DateTimeField initialIso={event?.gate_closes_at} label="Gate closes" namePrefix="gateCloses" />
        </div>

        <p className="mt-2 text-xs font-black uppercase">RSVP window (leave blank to keep RSVPs open until showtime)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <DateTimeField initialIso={event?.rsvp_opens_at} label="RSVPs open" namePrefix="rsvpOpens" />
          <DateTimeField initialIso={event?.rsvp_closes_at} label="RSVPs close" namePrefix="rsvpCloses" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-xs font-black uppercase">
            Standard seats
            <input className={field} defaultValue={event?.capacity_standard ?? 80} min={0} name="capacityStandard" type="number" />
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Overflow seats
            <input className={field} defaultValue={event?.capacity_overflow ?? 20} min={0} name="capacityOverflow" type="number" />
          </label>
          <label className="grid gap-1 text-xs font-black uppercase">
            Max tickets per RSVP
            <input className={field} defaultValue={event?.max_tickets_per_rsvp ?? 4} max={10} min={1} name="maxTicketsPerRsvp" type="number" />
          </label>
        </div>

        <textarea
          className={`${area} min-h-20`}
          defaultValue={(event?.program || []).join("\n")}
          name="program"
          placeholder={"Program, one item per line:\nPre-show trailers\nFeature one\nIntermission\nFeature two"}
        />
        <textarea className={`${area} min-h-20`} defaultValue={event?.entry_instructions || ""} name="entryInstructions" placeholder="How guests get in (gate instructions)" />
        <textarea className={`${area} min-h-16`} defaultValue={event?.host_note || ""} name="hostNote" placeholder="Host note (optional)" />
        <textarea className={`${area} min-h-16`} defaultValue={event?.accessibility_note || ""} name="accessibilityNote" placeholder="Accessibility note (optional)" />
        <textarea className={`${area} min-h-16`} defaultValue={event?.admin_notes || ""} name="adminNotes" placeholder="Private team notes (never shown to guests)" />

        <label className="grid gap-1 text-xs font-black uppercase">
          Status
          <select className={`${field} normal-case`} defaultValue={event?.status || "draft"} name="status">
            <option value="draft">Draft — hidden from the public site</option>
            <option value="published">Published — live and taking RSVPs</option>
            <option value="cancelled">Cancelled — visible to admins only, RSVPs closed</option>
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
