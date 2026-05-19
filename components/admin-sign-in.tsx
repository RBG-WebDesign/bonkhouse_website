"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AdminSignIn() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function submit(formData: FormData) {
    setLoading(true);
    const email = String(formData.get("email") || "");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/admin`
      }
    });
    setLoading(false);
    setMessage(error ? error.message : "Magic link sent. Check your email.");
  }

  return (
    <form action={submit} className="rounded-[1.4rem] border-2 border-ink bg-white/70 p-5 shadow-sticker">
      <p className="font-display text-3xl">Admin sign in</p>
      <p className="mt-2 text-sm leading-6">
        Use an approved admin email. Supabase will send a magic link.
      </p>
      <input
        className="focus-ring mt-5 w-full rounded-full border-2 border-ink bg-paper px-4 py-3"
        name="email"
        placeholder="admin@email.com"
        required
        type="email"
      />
      <Button className="mt-4" disabled={loading} type="submit">
        {loading ? "Sending..." : "Send magic link"}
      </Button>
      {message ? <p className="mt-4 text-sm font-bold">{message}</p> : null}
    </form>
  );
}
