import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashTicketToken } from "@/lib/tickets";
import { requestOrigin } from "@/lib/utils";
import { emailCancellationOutcome, type CancellationRow } from "@/lib/waitlist";

// A bare link must never cancel anything: mail clients and security scanners
// prefetch links in emails. GET only shows the confirmation page; the
// cancellation happens on the POST from its button.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = new URL("/cancel", requestOrigin(request));
  target.searchParams.set("reservation", url.searchParams.get("reservation") || "");
  target.searchParams.set("token", url.searchParams.get("token") || "");
  return NextResponse.redirect(target);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const reservationId = String(form.get("reservation") || "");
  const token = String(form.get("token") || "");
  const origin = requestOrigin(request);

  if (!reservationId || !token) {
    return NextResponse.redirect(new URL("/cancel?error=1", origin), 303);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_reservation", {
    reservation_uuid: reservationId,
    supplied_token_hash: await hashTicketToken(token)
  });

  const rows = (Array.isArray(data) ? data : []) as CancellationRow[];
  if (error || !rows.some((row) => row.kind === "cancelled")) {
    return NextResponse.redirect(new URL("/cancel?error=1", origin), 303);
  }

  await emailCancellationOutcome(supabase, rows);

  return NextResponse.redirect(new URL("/cancel?done=1", origin), 303);
}
