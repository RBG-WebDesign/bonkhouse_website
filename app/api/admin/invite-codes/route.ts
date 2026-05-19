import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";

export async function POST(request: Request) {
  const { ok, supabase } = await isAdminRequest();

  if (!ok) {
    return NextResponse.json({ error: "Admin sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const eventId = String(body.eventId || "");
  const code = String(body.code || "").trim().toUpperCase();
  const maxUses = Math.max(1, Number(body.maxUses || 1));
  const note = String(body.note || "").trim();

  if (!eventId || !code) {
    return NextResponse.json({ error: "Event and code are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("invite_codes")
    .insert({
      event_id: eventId,
      code,
      max_uses: maxUses,
      note
    })
    .select("code")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not create invite code." }, { status: 500 });
  }

  return NextResponse.json(data);
}
