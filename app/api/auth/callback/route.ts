import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The public origin the browser used. Behind Netlify's proxy request.url can
// carry an internal host, so prefer the forwarded headers when present.
function publicOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = publicOrigin(request);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") || "/admin";
  // Only same-site paths: the session cookie was just set for THIS origin, so
  // sending the browser anywhere else (another host, an open redirect) would
  // land it logged out.
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/admin?signin=1", origin));
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
