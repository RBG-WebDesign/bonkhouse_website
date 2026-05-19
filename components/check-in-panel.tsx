"use client";

import { useEffect, useState } from "react";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";

type ValidationResult = {
  status: string;
  message: string;
  guestName?: string;
  eventTitle?: string;
  seatType?: string;
  checkedInAt?: string;
};

export function CheckInPanel({ initialToken = "" }: { initialToken?: string }) {
  const [token, setToken] = useState(initialToken);
  const [eventId, setEventId] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialToken) {
      void validate(initialToken);
    }
  }, [initialToken]);

  async function validate(value = token) {
    setLoading(true);
    setResult(null);
    const response = await fetch("/api/tickets/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: value, eventId: eventId || undefined })
    });
    const payload = await response.json();
    setLoading(false);
    setResult(payload);
  }

  return (
    <div className="rounded-[1.4rem] border-2 border-ink bg-white/72 p-5 shadow-sticker">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink bg-butter">
          <ScanLine />
        </span>
        <div>
          <p className="font-display text-3xl">Door check-in</p>
          <p className="text-sm">Paste a QR token or open this page from a ticket QR.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        <input
          className="focus-ring rounded-full border-2 border-ink bg-paper px-4 py-3"
          onChange={(event) => setToken(event.target.value)}
          placeholder="Ticket token"
          value={token}
        />
        <input
          className="focus-ring rounded-full border-2 border-ink bg-paper px-4 py-3"
          onChange={(event) => setEventId(event.target.value)}
          placeholder="Optional event id for wrong-event checks"
          value={eventId}
        />
      </div>
      <Button className="mt-4" disabled={loading || !token} onClick={() => validate()} type="button">
        {loading ? "Checking..." : "Validate ticket"}
      </Button>
      {result ? (
        <div className="mt-5 rounded-2xl border-2 border-ink bg-paper p-4">
          <p className="font-display text-3xl">{result.status}</p>
          <p className="mt-2 font-bold">{result.message}</p>
          {result.guestName ? <p className="mt-2 text-sm">Guest: {result.guestName}</p> : null}
          {result.eventTitle ? <p className="text-sm">Event: {result.eventTitle}</p> : null}
          {result.seatType ? <p className="text-sm">Seat: {result.seatType}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
