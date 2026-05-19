import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const tags = Array.isArray(body.tags) ? body.tags.map(String) : [];

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("email_subscribers").upsert(
    {
      email,
      name,
      tags,
      subscribed_at: new Date().toISOString()
    },
    { onConflict: "email" }
  );

  if (error) {
    return NextResponse.json({ error: "Could not join the list." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
