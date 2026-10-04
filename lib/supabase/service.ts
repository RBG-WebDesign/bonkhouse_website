import "server-only";
import { createClient } from "@supabase/supabase-js";

// This client bypasses RLS. Use only after an explicit server-side authorization
// check, or for the token-checked cancellation RPC. Never expose it to a browser.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server database access is not configured.");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}
