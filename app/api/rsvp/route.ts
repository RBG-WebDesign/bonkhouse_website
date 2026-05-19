import { NextResponse } from "next/server";
import { sendTicketEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { allocateSeatType, hashTicketToken, makeTicketToken, ticketQrDataUrl, ticketQrUrl } from "@/lib/tickets";
import { formatEventDate, siteUrl } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json();
  const eventId = String(body.eventId || "");
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const quantity = Math.max(1, Math.min(4, Number(body.quantity || 1)));
  const inviteCode = String(body.inviteCode || "").trim();

  if (!eventId || !name || !email) {
    return NextResponse.json({ error: "Name, email, and event are required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*, venues(*)")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (event.is_invite_only && !inviteCode) {
    return NextResponse.json({ error: "This event requires an invite code." }, { status: 403 });
  }

  if (inviteCode) {
    const { data: code } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("event_id", eventId)
      .eq("code", inviteCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!code || code.used_count >= code.max_uses) {
      return NextResponse.json({ error: "That invite code is not available." }, { status: 403 });
    }
  }

  const { data: counts } = await supabase.rpc("get_event_ticket_counts", { event_uuid: eventId });
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
  const cancelToken = makeTicketToken();

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .insert({
      event_id: eventId,
      guest_name: name,
      guest_email: email,
      quantity,
      status: reservationStatus,
      invite_code: inviteCode || null,
      cancel_token_hash: await hashTicketToken(cancelToken)
    })
    .select("id")
    .single();

  if (reservationError || !reservation) {
    return NextResponse.json({ error: "Could not create the reservation." }, { status: 500 });
  }

  const ticketRows = generated.map((ticket) => ({
    event_id: eventId,
    reservation_id: reservation.id,
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
      event_id: eventId,
      reservation_id: reservation.id,
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
      event_uuid: eventId,
      invite_code: inviteCode.toUpperCase()
    });
  }

  await sendTicketEmail({
    to: email,
    guestName: name,
    eventTitle: event.title,
    eventDate: formatEventDate(event.starts_at),
    cancelUrl: `${siteUrl()}/api/rsvp/cancel?reservation=${reservation.id}&token=${encodeURIComponent(cancelToken)}`,
    arrivalInstructions: event.entry_instructions || event.venues?.entry_instructions || "",
    tickets: generated.map((ticket, index) => ({
      label: `Ticket ${index + 1}`,
      seatType: ticket.seatType,
      qrUrl: ticket.qrUrl
    }))
  });

  return NextResponse.json({
    reservationId: reservation.id,
    status: reservationStatus,
    tickets: generated.map((ticket, index) => ({
      label: `Ticket ${index + 1}`,
      seatType: ticket.seatType,
      qrDataUrl: ticket.qrDataUrl
    }))
  });
}
