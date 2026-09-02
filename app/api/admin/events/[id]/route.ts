import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { eventPayloadToRow, resolveVenueId } from "@/lib/event-fields";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok, supabase } = await isAdminRequest();

  if (!ok) {
    return NextResponse.json({ error: "Admin sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { row, error: fieldError } = eventPayloadToRow(body);

  if (fieldError) {
    return NextResponse.json({ error: fieldError }, { status: 400 });
  }

  // Only touch the venue when the form sent one, so older clients can't blank it.
  const venue = body.venueName ? { venue_id: await resolveVenueId(supabase, body.venueName, body.venueAddress) } : {};

  const { data, error } = await supabase
    .from("events")
    .update({ ...row, ...venue, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,title,status")
    .single();

  if (error) {
    return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });
  }

  return NextResponse.json(data);
}

// Duplicate an event as a new draft.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ok, supabase } = await isAdminRequest();

  if (!ok) {
    return NextResponse.json({ error: "Admin sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const { data: source, error: sourceError } = await supabase.from("events").select("*").eq("id", id).single();

  if (sourceError || !source) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const { id: _id, created_at: _c, updated_at: _u, ...copy } = source;
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...copy,
      slug: `${source.slug}-copy-${Date.now().toString(36)}`,
      title: `${source.title} (copy)`,
      status: "draft"
    })
    .select("id,title")
    .single();

  if (error) {
    return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });
  }

  return NextResponse.json(data);
}

function friendlyDbError(message: string) {
  if (message.includes("events_slug_key")) {
    return "That URL slug is already used by another event.";
  }
  return "Could not save the event.";
}
