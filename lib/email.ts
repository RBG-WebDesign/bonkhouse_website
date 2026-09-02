import { renderBonkhouseEmail } from "@/lib/email-templates";
import { emailSiteUrl } from "@/lib/utils";

type TicketEmailInput = {
  to: string;
  guestName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
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

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Sunday Afternoon Bonkhouse <tickets@bonkhouse.com>",
      to: input.to,
      subject: `Your Bonkhouse tickets for ${input.eventTitle}`,
      html: renderBonkhouseEmail({
        variant: "confirmed",
        guestName: input.guestName,
        eventTitle: input.eventTitle,
        eventDate: input.eventDate,
        venue: input.venue,
        arrivalInstructions: input.arrivalInstructions,
        cancelUrl: input.cancelUrl,
        tickets: input.tickets,
        confirmationCode: input.confirmationCode,
        logoUrl: `${emailSiteUrl()}/email-masthead.png`
      })
    })
    });
  } catch (error) {
    console.error("Resend request failed:", error);
    return { ok: false, mode: "failed" as const };
  }

  if (!response.ok) {
    // Never let a failed email sink the reservation — the guest already has
    // their tickets on screen. Log it so it shows in the function logs.
    console.error(`Resend failed with ${response.status}: ${await response.text().catch(() => "")}`);
    return { ok: false, mode: "failed" as const };
  }

  return { ok: true, mode: "sent" as const };
}
