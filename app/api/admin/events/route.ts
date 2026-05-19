import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";

export async function POST(request: Request) {
  const { ok, supabase } = await isAdminRequest();

  if (!ok) {
    return NextResponse.json({ error: "Admin sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();

  if (!title || !slug || !body.startsAt || !body.doorsAt || !body.gateClosesAt) {
    return NextResponse.json({ error: "Title, slug, and times are required." }, { status: 400 });
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("name", "Gloria Kaufman Community Center")
    .maybeSingle();

  const { data, error } = await supabase
    .from("events")
    .insert({
      venue_id: venue?.id || null,
      title,
      slug,
      kicker: body.kicker || "",
      description: body.description || "",
      starts_at: new Date(body.startsAt).toISOString(),
      doors_at: new Date(body.doorsAt).toISOString(),
      gate_closes_at: new Date(body.gateClosesAt).toISOString(),
      entry_instructions: body.entryInstructions || "",
      host_note: body.hostNote || "",
      program: ["Pre-show trailers", "Feature one", "Intermission", "Feature two"],
      status: "published"
    })
    .select("id,title")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not create event." }, { status: 500 });
  }

  return NextResponse.json(data);
}
