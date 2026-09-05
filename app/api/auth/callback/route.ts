import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/utils";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestOrigin(request);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = requestUrl.searchParams.get("next") || "/admin";
  // Only same-site paths: the session cookie was just set for THIS origin, so
  // sending the browser anywhere else (another host, an open redirect) would
  // land it logged out.
  let next = new URL("/admin", origin);
  if (requestedNext.startsWith("/")) {
    try {
      const candidate = new URL(requestedNext, origin);
      if (candidate.origin === next.origin) next = candidate;
    } catch {
      // Malformed destinations use the normal admin landing page.
    }
  }

  const supabase = await createClient();

  // Magic-link emails carry token_hash (see the Supabase "Magic Link" email
  // template). Unlike the PKCE `code` flow it needs no cookie from the browser
  // that requested the link, so the link works from any browser or device.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      return NextResponse.redirect(new URL("/admin?signin=1&expired=1", origin));
    }
    return NextResponse.redirect(next);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/admin?signin=1&expired=1", origin));
    }
  }

  return NextResponse.redirect(next);
}
