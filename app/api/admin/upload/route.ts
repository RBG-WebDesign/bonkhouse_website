import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export async function POST(request: Request) {
  const { ok, supabase } = await isAdminRequest();

  if (!ok) {
    return NextResponse.json({ error: "Admin sign in required." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP, GIF, or SVG image." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Images must be 8 MB or smaller." }, { status: 400 });
  }

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").slice(-80);
  const path = `${Date.now().toString(36)}-${safeName}`;

  const { error } = await supabase.storage
    .from("event-art")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }

  const { data } = supabase.storage.from("event-art").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
