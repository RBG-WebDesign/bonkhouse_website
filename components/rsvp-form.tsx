"use client";

import { useState } from "react";
import { TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type RsvpResult = {
  reservationId: string;
  status: string;
  tickets: Array<{
    label: string;
    seatType: string;
    qrDataUrl?: string;
  }>;
};

export function RsvpForm({ eventId }: { eventId: string }) {
  const [result, setResult] = useState<RsvpResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    setError("");
    setResult(null);

    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        name: formData.get("name"),
        email: formData.get("email"),
        quantity: Number(formData.get("quantity") || 1),
        inviteCode: formData.get("inviteCode")
      })
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || "RSVP failed.");
      return;
    }

    setResult(payload);
  }

  if (result) {
    return (
      <div className="club-card rounded-lg p-5">
        <div className="flex items-center gap-3">
          <TicketCheck className="text-butter" size={28} />
          <div>
            <p className="font-display text-3xl uppercase text-white">Tickets confirmed</p>
            <p className="text-sm font-bold uppercase text-butter">{result.status}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {result.tickets.map((ticket) => (
            <div className="rounded-md border border-white/20 bg-black p-4" key={ticket.label}>
              <p className="font-bold text-white">{ticket.label}</p>
              <p className="text-sm uppercase text-butter">{ticket.seatType}</p>
              {ticket.qrDataUrl ? (
                <img alt={`${ticket.label} QR code`} className="mt-3 rounded-md border border-white/20" src={ticket.qrDataUrl} />
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-white/62">A confirmation email is queued. During local setup it is logged on the server.</p>
      </div>
    );
  }

  return (
    <form action={submit} className="club-card rounded-lg p-5">
      <p className="font-display text-3xl uppercase text-white">Free RSVP</p>
      <p className="mt-2 text-sm leading-6 text-white/66">
        First 100 RSVPs get standard seats. The next 20 are confirmed overflow, then the waitlist starts.
      </p>
      <div className="mt-5 grid gap-3">
        <input className="focus-ring rounded-md border border-white/20 bg-black px-4 py-3 text-white placeholder:text-white/42" name="name" placeholder="Name" required />
        <input className="focus-ring rounded-md border border-white/20 bg-black px-4 py-3 text-white placeholder:text-white/42" name="email" placeholder="Email" required type="email" />
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
          <select className="focus-ring rounded-md border border-white/20 bg-black px-4 py-3 text-white" defaultValue="1" name="quantity">
            {[1, 2, 3, 4].map((quantity) => (
              <option key={quantity} value={quantity}>
                {quantity}
              </option>
            ))}
          </select>
          <input className="focus-ring rounded-md border border-white/20 bg-black px-4 py-3 text-white placeholder:text-white/42" name="inviteCode" placeholder="Invite code, optional" />
        </div>
      </div>
      <Button className="mt-5" disabled={loading} type="submit">
        {loading ? "Holding seats..." : "Reserve tickets"}
      </Button>
      {error ? <p className="mt-4 text-sm font-bold text-cherry">{error}</p> : null}
    </form>
  );
}
