// Shared validation/mapping between the admin event form payload and the
// events table row. Used by both the create and update API routes.

const STATUSES = ["draft", "published", "archived", "cancelled"];

export function eventPayloadToRow(body: any): { row?: Record<string, unknown>; error?: string } {
  const title = String(body.title || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();

  if (!title || !slug) {
    return { error: "Title and URL slug are required." };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "The URL slug can only contain lowercase letters, numbers, and dashes." };
  }

  if (!isoOrNull(body.startsAt) || !isoOrNull(body.doorsAt)) {
    return { error: "Event date, doors time, and start time are required." };
  }

  const status = String(body.status || "draft");
  if (!STATUSES.includes(status)) {
    return { error: "Unknown event status." };
  }

  const capacityStandard = clampInt(body.capacityStandard, 0, 5000, 80);
  const capacityOverflow = clampInt(body.capacityOverflow, 0, 5000, 20);
  const maxTickets = clampInt(body.maxTicketsPerRsvp, 1, 10, 4);

  return {
    row: {
      title,
      slug,
      subtitle: String(body.subtitle || "").trim(),
      kicker: String(body.kicker || "").trim(),
      description: String(body.description || "").trim(),
      poster_url: body.posterUrl || null,
      logo_url: body.logoUrl || null,
      starts_at: isoOrNull(body.startsAt),
      ends_at: isoOrNull(body.endsAt),
      doors_at: isoOrNull(body.doorsAt),
      gate_closes_at: isoOrNull(body.gateClosesAt) || isoOrNull(body.startsAt),
      rsvp_opens_at: isoOrNull(body.rsvpOpensAt),
      rsvp_closes_at: isoOrNull(body.rsvpClosesAt),
      capacity_standard: capacityStandard,
      capacity_overflow: capacityOverflow,
      max_tickets_per_rsvp: maxTickets,
      status,
      program: parseProgram(body.program),
      entry_instructions: String(body.entryInstructions || "").trim(),
      host_note: String(body.hostNote || "").trim(),
      accessibility_note: String(body.accessibilityNote || "").trim(),
      admin_notes: String(body.adminNotes || "").trim()
      // ticket_type / price_cents are intentionally not written here: the
      // form has no inputs for them, and updates must not reset a value
      // configured elsewhere. New rows get the column defaults (free / 0).
    }
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function isoOrNull(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseProgram(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
