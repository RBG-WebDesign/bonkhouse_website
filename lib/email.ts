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
      from: process.env.RESEND_FROM || "Sunday Afternoon Bonkhouse <tickets@example.com>",
      to: input.to,
      subject: `Your Bonkhouse tickets for ${input.eventTitle}`,
      html: renderTicketEmail(input)
    })
  });

  if (!response.ok) {
    throw new Error(`Resend failed with ${response.status}`);
  }

  return { ok: true, mode: "sent" as const };
}

function renderTicketEmail(input: TicketEmailInput) {
  const tickets = input.tickets
    .map(
      (ticket) => `
        <li>
          <strong>${ticket.label}</strong> (${ticket.seatType})<br />
          <a href="${ticket.qrUrl}">Open ticket QR</a>
        </li>`
    )
    .join("");

  return `
    <div style="font-family: Georgia, serif; color: #20160f;">
      <h1>Sunday Afternoon Bonkhouse</h1>
      <p>Hi ${input.guestName}, your free tickets are confirmed for <strong>${input.eventTitle}</strong>.</p>
      <p>${input.eventDate}</p>
      <ul>${tickets}</ul>
      <p>${input.arrivalInstructions}</p>
      <p><a href="${input.cancelUrl}">Cancel this RSVP</a></p>
    </div>
  `;
}
