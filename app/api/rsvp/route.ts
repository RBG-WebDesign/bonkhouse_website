import { NextResponse } from "next/server";
import { sendTicketEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { allocateSeatType, hashTicketToken, makeTicketToken, ticketQrDataUrl, ticketQrUrl } from "@/lib/tickets";
import { emailSiteUrl, formatEventDate } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json();
  const eventId = String(body.eventId || "");
  const eventSlug = String(body.eventSlug || "").trim();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const quantity = Math.max(1, Math.min(4, Number(body.quantity || 1)));
  const inviteCode = String(body.inviteCode || "").trim();

  if ((!eventId && !eventSlug) || !name || !email) {
    return NextResponse.json({ error: "Name, email, and event are required." }, { status: 400 });
  }

  const supabase = await createClient();
  let eventQuery = supabase
    .from("events")
    .select("*, venues(*)");

  eventQuery = eventId ? eventQuery.eq("id", eventId) : eventQuery.eq("slug", eventSlug);

  const { data: event, error: eventError } = await eventQuery.single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (event.status !== "published") {
    return NextResponse.json({ error: "RSVPs are not open for this event." }, { status: 403 });
  }

  const resolvedEventId = event.id;

  if (event.is_invite_only && !inviteCode) {
    return NextResponse.json({ error: "This event requires an invite code." }, { status: 403 });
  }

  if (inviteCode) {
    const { data: code } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("event_id", resolvedEventId)
      .eq("code", inviteCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!code || code.used_count >= code.max_uses) {
      return NextResponse.json({ error: "That invite code is not available." }, { status: 403 });
    }
  }

  const { data: counts } = await supabase.rpc("get_event_ticket_counts", { event_uuid: resolvedEventId });
  const taken = Number(counts?.[0]?.confirmed_count || 0);
  const standardCapacity = Number(event.capacity_standard || 100);
  const overflowCapacity = Number(event.capacity_overflow || 20);
  const generated = await Promise.all(
    Array.from({ length: quantity }).map(async (_, index) => {
      const seatType = allocateSeatType(taken + index, standardCapacity, overflowCapacity);
      const token = makeTicketToken();
      return {
        token,
        tokenHash: await hashTicketToken(token),
        seatType,
        qrDataUrl: seatType === "waitlist" ? "" : await ticketQrDataUrl(token),
        qrUrl: ticketQrUrl(token)
      };
    })
  );
  const reservationStatus = generated.every((ticket) => ticket.seatType === "waitlist")
    ? "waitlisted"
    : "confirmed";
  const reservationId = crypto.randomUUID();
  const cancelToken = makeTicketToken();

  const { error: reservationError } = await supabase
    .from("reservations")
    .insert({
      id: reservationId,
      event_id: resolvedEventId,
      guest_name: name,
      guest_email: email,
      quantity,
      status: reservationStatus,
      invite_code: inviteCode || null,
      cancel_token_hash: await hashTicketToken(cancelToken)
    });

  if (reservationError) {
    return NextResponse.json({ error: "Could not create the reservation." }, { status: 500 });
  }

  const ticketRows = generated.map((ticket) => ({
    event_id: resolvedEventId,
    reservation_id: reservationId,
    token_hash: ticket.tokenHash,
    seat_type: ticket.seatType,
    status: ticket.seatType === "waitlist" ? "waitlisted" : "valid"
  }));

  const { error: ticketError } = await supabase.from("tickets").insert(ticketRows);

  if (ticketError) {
    return NextResponse.json({ error: "Could not create tickets." }, { status: 500 });
  }

  const waitlistRows = generated
    .map((ticket, index) => ({ ticket, index }))
    .filter(({ ticket }) => ticket.seatType === "waitlist")
    .map(({ index }) => ({
      event_id: resolvedEventId,
      reservation_id: reservationId,
      guest_name: name,
      guest_email: email,
      party_size: quantity,
      position_hint: taken + index + 1
    }));

  if (waitlistRows.length) {
    await supabase.from("waitlist_entries").insert(waitlistRows);
  }

  if (inviteCode) {
    await supabase.rpc("increment_invite_code_use", {
      event_uuid: resolvedEventId,
      invite_code: inviteCode.toUpperCase()
    });
  }

  await sendTicketEmail({
    to: email,
    guestName: name,
    eventTitle: event.title,
    eventDate: formatEventDate(event.starts_at),
    cancelUrl: `${emailSiteUrl()}/api/rsvp/cancel?reservation=${reservationId}&token=${encodeURIComponent(cancelToken)}`,
    arrivalInstructions: event.entry_instructions || event.venues?.entry_instructions || "",
    confirmationCode: `BONK-${reservationId.slice(0, 8).toUpperCase()}`,
    tickets: generated.map((ticket, index) => ({
      label: `Ticket ${index + 1}`,
      seatType: ticket.seatType,
      // The email must embed a real image URL, not the check-in page link —
      // and it must be publicly reachable, never localhost.
      qrUrl: `${emailSiteUrl()}/api/ticket-qr?token=${encodeURIComponent(ticket.token)}`
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
