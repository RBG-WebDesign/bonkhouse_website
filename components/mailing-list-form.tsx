"use client";

import { useState } from "react";
import { ArrowRight, Popcorn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MailingListForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit(formData: FormData) {
    setStatus("loading");
    const response = await fetch("/api/mailing-list", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        name: formData.get("name"),
        tags: formData.getAll("tags")
      }),
      headers: { "Content-Type": "application/json" }
    });

    setStatus(response.ok ? "success" : "error");
  }

  return (
    <form action={submit} className="relative border border-butter/80 bg-black p-5 shadow-[0_0_30px_rgba(255,212,0,0.08)]">
      <div className="absolute -left-1 top-3 h-20 border-l-2 border-dashed border-butter/80" />
      <div className="absolute -right-1 bottom-3 h-20 border-r-2 border-dashed border-butter/80" />
      <div className="grid gap-5 md:grid-cols-[8rem_1fr] md:items-center">
        <span className="grid h-24 w-24 place-items-center text-butter">
          <Popcorn size={72} strokeWidth={1.3} />
        </span>
        <div>
          <p className="font-display text-3xl uppercase leading-none text-white">Stay in the loop.</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/62">
            Get the weekly lineup, club updates, and handpicked film recs in your inbox.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input
          className="focus-ring rounded-md border border-white/20 bg-black px-4 py-3 text-white placeholder:text-white/42"
          name="name"
          placeholder="Name"
        />
        <input
          className="focus-ring rounded-md border border-white/20 bg-black px-4 py-3 text-white placeholder:text-white/42"
          name="email"
          placeholder="Email"
          required
          type="email"
        />
        <Button disabled={status === "loading"} type="submit" variant="default">
          {status === "loading" ? "Joining..." : "Join the club"}
          <ArrowRight size={16} />
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold uppercase text-white/70">
        {["screenings", "merch", "filmmaker opportunities", "volunteer"].map((tag) => (
          <label className="inline-flex items-center gap-2 rounded border border-white/20 bg-white/[0.04] px-3 py-2" key={tag}>
            <input name="tags" type="checkbox" value={tag} />
            {tag}
          </label>
        ))}
      </div>
      {status === "success" ? <p className="mt-4 text-sm font-bold text-butter">You are on the list.</p> : null}
      {status === "error" ? <p className="mt-4 text-sm font-bold text-cherry">Something did not land. Try again.</p> : null}
    </form>
  );
}
