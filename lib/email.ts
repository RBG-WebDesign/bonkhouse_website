import { renderBonkhouseEmail } from "@/lib/email-templates";

type TicketEmailInput = {
  to: string;
  guestName: string;
  eventTitle: string;
  eventDate: string;
  cancelUrl: string;
  tickets: Array<{
    label: string;
    seatType: string;
    qrUrl: string;
  }>;
  arrivalInstructions: string;
  confirmationCode: string;
};

export async function sendTicketEmail(input: TicketEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("Ticket email placeholder", JSON.stringify(input, null, 2));
    return { ok: true, mode: "logged" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Sunday Afternoon Bonkhouse <onboarding@resend.dev>",
      to: input.to,
      subject: `Your Bonkhouse tickets for ${input.eventTitle}`,
      html: renderBonkhouseEmail({
        variant: "confirmed",
        guestName: input.guestName,
        eventTitle: input.eventTitle,
        eventDate: input.eventDate,
        venue: "Gloria Kaufman Community Center · Culver City, CA",
        arrivalInstructions: input.arrivalInstructions,
        cancelUrl: input.cancelUrl,
        tickets: input.tickets,
        confirmationCode: input.confirmationCode,
        logoUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/logo_fixed_transparent.png`
      })
    })
  });

  if (!response.ok) {
    throw new Error(`Resend failed with ${response.status}`);
  }

  return { ok: true, mode: "sent" as const };
}
