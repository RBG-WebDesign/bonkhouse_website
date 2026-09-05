"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DuplicateEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function duplicate() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not duplicate.");
      router.push(`/admin/events/${payload.id}`);
    } catch (error) {
      alert(error instanceof Error && error.message ? error.message : "Could not duplicate.");
      setBusy(false);
    }
  }

  return (
    <Button disabled={busy} onClick={duplicate} type="button" variant="secondary">
      <Copy size={18} />
      {busy ? "Duplicating…" : "Duplicate as draft"}
    </Button>
  );
}
