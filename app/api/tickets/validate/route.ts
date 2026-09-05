import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { hashTicketToken } from "@/lib/tickets";

export async function POST(request: Request) {
  const { ok, supabase } = await isAdminRequest();

  if (!ok) {
    return NextResponse.json({ status: "Blocked", message: "Admin sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const token = String(body.token || "");
  const eventId = body.eventId ? String(body.eventId) : "";

  if (!token) {
    return NextResponse.json({ status: "Missing", message: "No ticket token provided." }, { status: 400 });
  }

  const tokenHash = await hashTicketToken(token);
  const { data: ticket, error: lookupError } = await supabase
    .from("tickets")
    .select("*, events(id,title), reservations(guest_name,guest_email)")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ status: "Error", message: "Could not look up this ticket. Try again." }, { status: 500 });
  }

  if (!ticket) {
    return NextResponse.json({ status: "Invalid", message: "Ticket not found. Flag this at the door." }, { status: 404 });
  }

  if (eventId && ticket.event_id !== eventId) {
    return NextResponse.json({
      status: "Wrong event",
      message: `This ticket belongs to ${ticket.events?.title || "another event"}.`,
      guestName: ticket.reservations?.guest_name,
      eventTitle: ticket.events?.title,
      seatType: ticket.seat_type
    });
  }

  if (ticket.status === "cancelled") {
    return NextResponse.json({
      status: "Cancelled",
      message: "This ticket was cancelled.",
      guestName: ticket.reservations?.guest_name,
      eventTitle: ticket.events?.title,
      seatType: ticket.seat_type
    });
  }

  if (ticket.status === "waitlisted" || ticket.seat_type === "waitlist") {
    return NextResponse.json({
      status: "Waitlist",
      message: "This guest is waitlisted, not confirmed.",
      guestName: ticket.reservations?.guest_name,
      eventTitle: ticket.events?.title,
      seatType: ticket.seat_type
    });
  }

  if (ticket.checked_in_at) {
    return NextResponse.json({
      status: "Already used",
      message: `Checked in at ${new Date(ticket.checked_in_at).toLocaleString()}.`,
      guestName: ticket.reservations?.guest_name,
      eventTitle: ticket.events?.title,
      seatType: ticket.seat_type,
      checkedInAt: ticket.checked_in_at
    });
  }

  const checkedInAt = new Date().toISOString();
  // Claim the ticket in one conditional write so two scans cannot both admit it.
  const { data: claimed, error: checkInError } = await supabase
    .from("tickets")
    .update({ checked_in_at: checkedInAt })
    .eq("id", ticket.id)
    .eq("status", "valid")
    .neq("seat_type", "waitlist")
    .is("checked_in_at", null)
    .select("id")
    .maybeSingle();

  if (checkInError) {
    return NextResponse.json({ status: "Error", message: "Could not save this check-in. Try again." }, { status: 500 });
  }

  if (!claimed) {
    return NextResponse.json({
      status: "Not checked in",
      message: "This ticket was just checked in or changed. Scan it again to see its current status."
    }, { status: 409 });
  }

  const { error: logError } = await supabase.from("checkins").insert({
    event_id: ticket.event_id,
    ticket_id: ticket.id,
    checked_in_at: checkedInAt
  });

  if (logError) {
    return NextResponse.json({
      status: "Check-in needs review",
      message: "The ticket was marked as checked in, but its log could not be saved. Ask the host to verify before admitting.",
      checkedInAt
    }, { status: 500 });
  }

  return NextResponse.json({
    status: "Good",
    message: "Checked in. Send them through.",
    guestName: ticket.reservations?.guest_name,
    eventTitle: ticket.events?.title,
    seatType: ticket.seat_type,
    checkedInAt
  });
}
