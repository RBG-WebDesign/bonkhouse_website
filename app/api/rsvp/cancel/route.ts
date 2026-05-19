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
  const tokenHash = await hashTicketToken(token);
  const { data: reservation } = await supabase
    .from("reservations")
    .select("id")
    .eq("id", reservationId)
    .eq("cancel_token_hash", tokenHash)
    .maybeSingle();

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }

  await supabase.from("reservations").update({ status: "cancelled" }).eq("id", reservationId);
  await supabase.from("tickets").update({ status: "cancelled" }).eq("reservation_id", reservationId);

  return new Response("Your Bonkhouse RSVP has been cancelled.", {
    headers: { "Content-Type": "text/plain" }
  });
}
