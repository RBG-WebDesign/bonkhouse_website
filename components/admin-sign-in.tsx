"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const inputClass = "focus-ring mt-2 w-full rounded-full border-2 border-ink bg-paper px-4 py-3";

export function AdminSignIn() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const supabase = createClient();

  async function signInWithPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setMessage(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
      return;
    }
    // Full navigation so the server sees the new session cookies.
    window.location.assign("/admin");
  }

  async function sendMagicLink() {
    if (!email) {
      setMessage("Enter your email first.");
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/admin` }
    });
    setLoading(false);
    setMessage(error ? error.message : "Link sent. Open the newest email; it works on any device.");
  }

  return (
    <form className="rounded-[1.4rem] border-2 border-ink bg-white/10 p-5 shadow-sticker" onSubmit={signInWithPassword}>
      <p className="font-display text-3xl">Admin sign in</p>
      <label className="mt-5 block text-xs font-black uppercase">
        Email
        <input
          autoComplete="username"
          className={inputClass}
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@email.com"
          required
          type="email"
          value={email}
        />
      </label>
      <label className="mt-4 block text-xs font-black uppercase">
        Password
        <input
          autoComplete="current-password"
          className={inputClass}
          name="password"
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button disabled={loading} type="submit">
          {loading ? "Working..." : "Sign in"}
        </Button>
        <button
          className="text-sm font-bold underline underline-offset-4 disabled:opacity-50"
          disabled={loading}
          onClick={sendMagicLink}
          type="button"
        >
          Forgot password? Email me a sign-in link
        </button>
      </div>
      {message ? <p className="mt-4 text-sm font-bold">{message}</p> : null}
    </form>
  );
}
