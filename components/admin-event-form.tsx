"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminEventForm() {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    const response = await fetch("/api/admin/events", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "Content-Type": "application/json" }
    });
    const payload = await response.json();
    setMessage(response.ok ? `Created ${payload.title}` : payload.error || "Could not create event.");
  }

  return (
    <form action={submit} className="rounded-[1.4rem] border-2 border-ink bg-white/70 p-5 shadow-sticker">
      <p className="font-display text-3xl">Create screening</p>
      <div className="mt-5 grid gap-3">
        <input className="focus-ring rounded-full border-2 border-ink bg-paper px-4 py-3" name="title" placeholder="Title" required />
        <input className="focus-ring rounded-full border-2 border-ink bg-paper px-4 py-3" name="slug" placeholder="url-slug" required />
        <input className="focus-ring rounded-full border-2 border-ink bg-paper px-4 py-3" name="kicker" placeholder="Short kicker" />
        <textarea className="focus-ring min-h-24 rounded-[1.2rem] border-2 border-ink bg-paper px-4 py-3" name="description" placeholder="Description" />
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="focus-ring rounded-full border-2 border-ink bg-paper px-4 py-3" name="doorsAt" required type="datetime-local" />
          <input className="focus-ring rounded-full border-2 border-ink bg-paper px-4 py-3" name="startsAt" required type="datetime-local" />
          <input className="focus-ring rounded-full border-2 border-ink bg-paper px-4 py-3" name="gateClosesAt" required type="datetime-local" />
        </div>
        <textarea className="focus-ring min-h-20 rounded-[1.2rem] border-2 border-ink bg-paper px-4 py-3" name="entryInstructions" placeholder="Side gate instructions" />
        <textarea className="focus-ring min-h-20 rounded-[1.2rem] border-2 border-ink bg-paper px-4 py-3" name="hostNote" placeholder="Host note" />
      </div>
      <Button className="mt-5" type="submit">Create event</Button>
      {message ? <p className="mt-4 text-sm font-bold">{message}</p> : null}
    </form>
  );
}
