import { emailSubject, renderBonkhouseEmail } from "@/lib/email-templates";
import { emailSiteUrl, formatEventDate, formatEventTime } from "@/lib/utils";

type TicketEmailInput = {
  to: string;
  guestName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  cancelUrl: string;
  tickets: Array<{
    label: string;
    seatType: string;
    qrUrl: string;
  }>;
  arrivalInstructions: string;
  confirmationCode: string;
};

type CancelledEmailInput = Pick<TicketEmailInput, "to" | "guestName" | "eventTitle" | "eventDate" | "venue">;

// The events row (with its venue joined) as the API routes read it. The
// Supabase client types the joined venue as an array; it is one row.
type VenueForEmail = { name?: string | null; address?: string | null; entry_instructions?: string | null };
export type EventForEmail = {
  id: string;
  title: string;
  starts_at: string;
  doors_at?: string | null;
  entry_instructions?: string | null;
  venues?: VenueForEmail | VenueForEmail[] | null;
};

export const EVENT_FOR_EMAIL_SELECT = "id,title,starts_at,doors_at,entry_instructions,venues(name,address,entry_instructions)";

export function eventEmailFields(event: EventForEmail) {
  const venue = Array.isArray(event.venues) ? event.venues[0] : event.venues;
  return {
    eventTitle: event.title,
    eventDate: `${formatEventDate(event.starts_at)} · Doors ${formatEventTime(event.doors_at || event.starts_at)}`,
    venue: [venue?.name, venue?.address].filter(Boolean).join(" · ") || "Sunday Afternoon Bonkhouse",
    arrivalInstructions: event.entry_instructions || venue?.entry_instructions || ""
  };
}

export function confirmationCode(reservationId: string) {
  return `BONK-${reservationId.slice(0, 8).toUpperCase()}`;
}

export function cancelUrl(reservationId: string, cancelToken: string) {
  return `${emailSiteUrl()}/cancel?reservation=${reservationId}&token=${encodeURIComponent(cancelToken)}`;
}

export function ticketQrImageUrl(token: string) {
  // Emails need a real image URL, publicly reachable — never localhost.
  return `${emailSiteUrl()}/api/ticket-qr?token=${encodeURIComponent(token)}`;
}

export async function sendTicketEmail(input: TicketEmailInput) {
  const variant = input.tickets.length > 0 && input.tickets.every((ticket) => ticket.seatType === "waitlist")
    ? "waitlisted"
    : "confirmed";
  return deliver({
    to: input.to,
    subject: emailSubject(variant, input.eventTitle),
    html: renderBonkhouseEmail({
      variant,
      guestName: input.guestName,
      eventTitle: input.eventTitle,
      eventDate: input.eventDate,
      venue: input.venue,
      arrivalInstructions: input.arrivalInstructions,
      cancelUrl: input.cancelUrl,
      tickets: input.tickets,
      confirmationCode: input.confirmationCode,
      logoUrl: `${emailSiteUrl()}/email-masthead.png`
    })
  });
}

export async function sendCancelledEmail(input: CancelledEmailInput) {
  return deliver({
    to: input.to,
    subject: emailSubject("cancelled", input.eventTitle),
    html: renderBonkhouseEmail({
      variant: "cancelled",
      guestName: input.guestName,
      eventTitle: input.eventTitle,
      eventDate: input.eventDate,
      venue: input.venue,
      arrivalInstructions: "",
      cancelUrl: "",
      tickets: [],
      confirmationCode: "",
      logoUrl: `${emailSiteUrl()}/email-masthead.png`
    })
  });
}

async function deliver({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("Email placeholder", JSON.stringify({ to, subject }, null, 2));
    return { ok: true, mode: "logged" as const };
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Sunday Afternoon Bonkhouse <tickets@bonkhouse.com>",
        to,
        subject,
        html
      })
    });
  } catch (error) {
    console.error("Resend request failed:", error);
    return { ok: false, mode: "failed" as const };
  }

  if (!response.ok) {
    // Never let a failed email sink the reservation — the guest already has
    // their tickets on screen. Log it so it shows in the function logs.
    console.error(`Resend failed with ${response.status}: ${await response.text().catch(() => "")}`);
    return { ok: false, mode: "failed" as const };
  }

  return { ok: true, mode: "sent" as const };
}
