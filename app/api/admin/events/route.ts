import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { eventPayloadToRow } from "@/lib/event-fields";

export async function POST(request: Request) {
  const { ok, supabase } = await isAdminRequest();

  if (!ok) {
    return NextResponse.json({ error: "Admin sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const { row, error: fieldError } = eventPayloadToRow(body);

  if (fieldError) {
    return NextResponse.json({ error: fieldError }, { status: 400 });
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("name", String(body.venueName || "Gloria Kaufman Community Center"))
    .maybeSingle();

  const { data, error } = await supabase
    .from("events")
    .insert({ ...row, venue_id: venue?.id || null })
    .select("id,title,status")
    .single();

  if (error) {
    const message = error.message.includes("events_slug_key")
      ? "That URL slug is already used by another event."
      : "Could not create the event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(data);
}
