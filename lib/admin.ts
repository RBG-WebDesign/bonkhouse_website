import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/admin?signin=1");
  }

  const { data } = await supabase
    .from("admin_profiles")
    .select("id,email,role")
    .eq("email", user.email)
    .maybeSingle();

  if (!data) {
    redirect("/admin?forbidden=1");
  }

  return { supabase, user, profile: data };
}

export async function isAdminRequest() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false as const, supabase, user: null };
  }

  const { data } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  return { ok: Boolean(data), supabase, user };
}
