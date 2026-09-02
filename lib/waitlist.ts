import type { SupabaseClient } from "@supabase/supabase-js";
import {
  cancelUrl,
  confirmationCode,
  EVENT_FOR_EMAIL_SELECT,
  eventEmailFields,
  sendCancelledEmail,
  sendTicketEmail,
  ticketQrImageUrl,
  type EventForEmail
} from "@/lib/email";

// One row per affected guest, as returned by cancel_reservation and
// admin_remove_reservation: the cancelled/removed guest first, then anyone
// promoted off the waitlist with their freshly minted tokens.
export type CancellationRow = {
  kind: "cancelled" | "removed" | "promoted";
  reservation_id: string;
  event_id: string;
  guest_name: string;
  guest_email: string;
  quantity: number;
  seat_types: string[] | null;
  tokens: string[] | null;
  cancel_token: string | null;
};

// Emails everyone a cancellation touched: the guest who left (unless it was an
// admin removal) and everyone who just got seats. Email failures are logged,
// never thrown — the database change has already happened.
export async function emailCancellationOutcome(supabase: Pick<SupabaseClient, "from">, rows: CancellationRow[]) {
  const first = rows[0];
  if (!first) return;

  const { data: event } = await supabase
    .from("events")
    .select(EVENT_FOR_EMAIL_SELECT)
    .eq("id", first.event_id)
    .single<EventForEmail>();
  if (!event) return;

  const fields = eventEmailFields(event);

  for (const row of rows) {
    if (row.kind === "cancelled") {
      await sendCancelledEmail({
        to: row.guest_email,
        guestName: row.guest_name,
        eventTitle: fields.eventTitle,
        eventDate: fields.eventDate,
        venue: fields.venue
      });
    } else if (row.kind === "promoted" && row.tokens?.length && row.cancel_token) {
      await sendTicketEmail({
        to: row.guest_email,
        guestName: row.guest_name,
        ...fields,
        cancelUrl: cancelUrl(row.reservation_id, row.cancel_token),
        confirmationCode: confirmationCode(row.reservation_id),
        tickets: row.tokens.map((token, index) => ({
          label: `Ticket ${index + 1}`,
          seatType: row.seat_types?.[index] || "standard",
          qrUrl: ticketQrImageUrl(token)
        }))
      });
    }
  }
}
