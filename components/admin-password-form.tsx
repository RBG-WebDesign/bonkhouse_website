"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const inputClass = "focus-ring mt-2 w-full rounded-full border-2 border-ink bg-paper px-4 py-3";

export function AdminPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 12) {
      setMessage("Use at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("The two passwords do not match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    setMessage(error ? error.message : "Password saved. Use it on the sign-in page from now on.");
    if (!error) {
      setPassword("");
      setConfirm("");
    }
  }

  return (
    <form className="rounded-[1.4rem] border-2 border-ink bg-white/10 p-5 shadow-sticker" onSubmit={submit}>
      <label className="block text-xs font-black uppercase">
        New password
        <input autoComplete="new-password" className={inputClass} minLength={12} onChange={(e) => setPassword(e.target.value)} required type="password" value={password} />
      </label>
      <label className="mt-4 block text-xs font-black uppercase">
        Confirm password
        <input autoComplete="new-password" className={inputClass} minLength={12} onChange={(e) => setConfirm(e.target.value)} required type="password" value={confirm} />
      </label>
      <Button className="mt-5" disabled={saving} type="submit">
        {saving ? "Saving..." : "Save password"}
      </Button>
      {message ? <p className="mt-4 text-sm font-bold">{message}</p> : null}
    </form>
  );
}
