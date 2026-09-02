import { NextResponse } from "next/server";
import {
  cancelUrl,
  confirmationCode,
  EVENT_FOR_EMAIL_SELECT,
  eventEmailFields,
  sendTicketEmail,
  ticketQrImageUrl
} from "@/lib/email";
import { rsvpErrorResponse } from "@/lib/rsvp-errors";
import { createClient } from "@/lib/supabase/server";
import { hashTicketToken, makeTicketToken, ticketQrDataUrl, ticketQrUrl } from "@/lib/tickets";

export async function POST(request: Request) {
  const body = await request.json();
  const eventId = String(body.eventId || "");
  const eventSlug = String(body.eventSlug || "").trim();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const rawQuantity = Number(body.quantity ?? 1);
  if (!Number.isFinite(rawQuantity)) {
    return NextResponse.json({ error: "Ticket quantity must be a number." }, { status: 400 });
  }
  const quantity = Math.max(1, Math.min(10, Math.round(rawQuantity)));
  const inviteCode = String(body.inviteCode || "").trim();

  if ((!eventId && !eventSlug) || !name || !email) {
    return NextResponse.json({ error: "Name, email, and event are required." }, { status: 400 });
  }

  const supabase = await createClient();
  let eventQuery = supabase.from("events").select(`${EVENT_FOR_EMAIL_SELECT},status,is_invite_only,rsvp_opens_at,rsvp_closes_at,gate_closes_at,max_tickets_per_rsvp`);
  eventQuery = eventId ? eventQuery.eq("id", eventId) : eventQuery.eq("slug", eventSlug);
  const { data: event, error: eventError } = await eventQuery.single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (event.status !== "published") {
    return NextResponse.json({ error: "RSVPs are not open for this event." }, { status: 403 });
  }

  if (event.is_invite_only && !inviteCode) {
    return NextResponse.json({ error: "This event requires an invite code." }, { status: 403 });
  }

  if (inviteCode) {
    const { data: code } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("event_id", event.id)
      .eq("code", inviteCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!code || code.used_count >= code.max_uses) {
      return NextResponse.json({ error: "That invite code is not available." }, { status: 403 });
    }
  }

  // The database function enforces all of these too; checking here just gives
  // a clearer message without a round trip.
  const now = Date.now();
  if (event.rsvp_opens_at && now < new Date(event.rsvp_opens_at).getTime()) {
    return NextResponse.json({ error: "RSVPs have not opened yet for this screening." }, { status: 403 });
  }
  const closesAt = event.rsvp_closes_at || event.gate_closes_at;
  if (closesAt && now > new Date(closesAt).getTime()) {
    return NextResponse.json({ error: "RSVPs have closed for this screening." }, { status: 403 });
  }
  const maxPerRsvp = Math.max(1, Math.min(10, Number(event.max_tickets_per_rsvp || 4)));
  if (quantity > maxPerRsvp) {
    return NextResponse.json({ error: `This screening allows up to ${maxPerRsvp} tickets per RSVP.` }, { status: 400 });
  }

  const tokens = Array.from({ length: quantity }, () => makeTicketToken());
  const tokenHashes = await Promise.all(tokens.map((token) => hashTicketToken(token)));
  const cancelToken = makeTicketToken();

  // Seat allocation happens inside the database with the event row locked, so
  // simultaneous RSVPs cannot oversell the last seats.
  const { data: created, error: reservationError } = await supabase.rpc("create_reservation_atomic", {
    event_uuid: event.id,
    p_guest_name: name,
    p_guest_email: email,
    p_quantity: quantity,
    p_invite_code: inviteCode || "",
    p_cancel_token_hash: await hashTicketToken(cancelToken),
    p_token_hashes: tokenHashes
  });

  const reservationId = created?.[0]?.reservation_id as string | undefined;
  const seatTypes = (created?.[0]?.seat_types as string[] | undefined) || [];

  if (reservationError || !reservationId) {
    const { status, error } = rsvpErrorResponse(reservationError?.message);
    return NextResponse.json({ error }, { status });
  }

  const generated = await Promise.all(
    tokens.map(async (token, index) => {
      const seatType = seatTypes[index] || "waitlist";
      return {
        token,
        seatType,
        qrDataUrl: seatType === "waitlist" ? "" : await ticketQrDataUrl(token),
        qrUrl: ticketQrUrl(token)
      };
    })
  );
  const reservationStatus = generated.every((ticket) => ticket.seatType === "waitlist")
    ? "waitlisted"
    : "confirmed";

  if (inviteCode) {
    await supabase.rpc("increment_invite_code_use", {
      event_uuid: event.id,
      invite_code: inviteCode.toUpperCase()
    });
  }

  await sendTicketEmail({
    to: email,
    guestName: name,
    ...eventEmailFields(event),
    cancelUrl: cancelUrl(reservationId, cancelToken),
    confirmationCode: confirmationCode(reservationId),
    tickets: generated.map((ticket, index) => ({
      label: `Ticket ${index + 1}`,
      seatType: ticket.seatType,
      qrUrl: ticketQrImageUrl(ticket.token)
    }))
  });

  return NextResponse.json({
    reservationId,
    status: reservationStatus,
    tickets: generated.map((ticket, index) => ({
      label: `Ticket ${index + 1}`,
      seatType: ticket.seatType,
      qrDataUrl: ticket.qrDataUrl
    }))
  });
}
