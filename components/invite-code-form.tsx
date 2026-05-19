"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function InviteCodeForm({ eventId }: { eventId: string }) {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    const response = await fetch("/api/admin/invite-codes", {
      method: "POST",
      body: JSON.stringify({
        eventId,
        code: formData.get("code"),
        maxUses: Number(formData.get("maxUses") || 1),
        note: formData.get("note")
      }),
      headers: { "Content-Type": "application/json" }
    });
    const payload = await response.json();
    setMessage(response.ok ? `Invite code ${payload.code} created.` : payload.error || "Could not create invite code.");
  }

  return (
    <form action={submit} className="rounded-[1.4rem] border-2 border-ink bg-butter p-5">
      <p className="font-display text-3xl">Invite code</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem]">
        <input className="focus-ring rounded-full border-2 border-ink bg-paper px-4 py-3" name="code" placeholder="FRIENDS25" required />
        <input className="focus-ring rounded-full border-2 border-ink bg-paper px-4 py-3" defaultValue="1" min="1" name="maxUses" type="number" />
      </div>
      <input className="focus-ring mt-3 w-full rounded-full border-2 border-ink bg-paper px-4 py-3" name="note" placeholder="Note" />
      <Button className="mt-4" type="submit" variant="quiet">Create code</Button>
      {message ? <p className="mt-4 text-sm font-bold">{message}</p> : null}
    </form>
  );
}
