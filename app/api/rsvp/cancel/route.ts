import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashTicketToken } from "@/lib/tickets";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reservationId = String(url.searchParams.get("reservation") || "");
  const token = String(url.searchParams.get("token") || "");

  if (!reservationId || !token) {
    return NextResponse.json({ error: "Reservation and token are required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: cancelled, error } = await supabase.rpc("cancel_reservation", {
    reservation_uuid: reservationId,
    supplied_token_hash: await hashTicketToken(token)
  });

  if (error || !cancelled) {
    return NextResponse.json({ error: "Reservation not found or cancellation token invalid." }, { status: 404 });
  }

  return new Response("Your Bonkhouse RSVP has been cancelled.", {
    headers: { "Content-Type": "text/plain" }
  });
}
