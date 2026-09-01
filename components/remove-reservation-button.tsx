"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveReservationButton({
  reservationId,
  guestName
}: {
  reservationId: string;
  guestName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!window.confirm(`Remove ${guestName}'s reservation and free their seats?`)) {
      return;
    }

    setBusy(true);
    setError("");
    const response = await fetch(`/api/admin/reservations/${reservationId}`, { method: "DELETE" });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error || "Could not remove.");
      setBusy(false);
      return;
    }

    router.refresh();
  }

  return (
    <span>
      <button
        className="rounded-md border-2 border-ink bg-white px-3 py-1 text-xs font-black uppercase text-cherry transition hover:bg-cherry hover:text-white disabled:opacity-50"
        disabled={busy}
        onClick={remove}
        type="button"
      >
        {busy ? "Removing…" : "Remove"}
      </button>
      {error ? <span className="ml-2 text-xs font-bold text-cherry">{error}</span> : null}
    </span>
  );
}
