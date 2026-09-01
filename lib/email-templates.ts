export type EmailVariant = "confirmed" | "waitlisted" | "cancelled" | "reminder" | "newsletter";

export type EmailTicket = {
  label: string;
  seatType: string;
  qrUrl: string;
};

export type BonkhouseEmailInput = {
  variant: EmailVariant;
  guestName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  arrivalInstructions: string;
  cancelUrl: string;
  tickets: EmailTicket[];
  logoUrl: string;
  confirmationCode: string;
};

const copy = {
  confirmed: {
    eyebrow: "RSVP CONFIRMED",
    headline: "YOUR SEATS ARE IN THE BAG",
    intro: "Your free Bonkhouse tickets are confirmed. Keep this email handy when you arrive.",
    accent: "#ffd400",
    accentInk: "#080705"
  },
  waitlisted: {
    eyebrow: "WAITLIST RECEIVED",
    headline: "YOU’RE IN LINE",
    intro: "The room is currently full, but your spot on the waitlist is saved. We’ll email you if seats open up.",
    accent: "#ff5a36",
    accentInk: "#fff8e8"
  },
  cancelled: {
    eyebrow: "RSVP CANCELLED",
    headline: "YOUR SEATS ARE RELEASED",
    intro: "Your reservation has been cancelled and the seats are available to another moviegoer.",
    accent: "#d8d1c2",
    accentInk: "#080705"
  },
  reminder: {
    eyebrow: "SCREENING REMINDER",
    headline: "TOMORROW GETS FLESHY",
    intro: "Your Bonkhouse screening is almost here. Bring your ticket and arrive before the side gate closes.",
    accent: "#ffd400",
    accentInk: "#080705"
  },
  newsletter: {
    eyebrow: "SUNDAY AFTERNOON BONKHOUSE",
    headline: "YOU’RE ON THE LIST",
    intro: "",
    accent: "#ffd400",
    accentInk: "#080705"
  }
} satisfies Record<EmailVariant, { eyebrow: string; headline: string; intro: string; accent: string; accentInk: string }>;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ticketMarkup(ticket: EmailTicket, accent: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin:12px 10px 0 0;vertical-align:top;">
      <tr>
        <td style="text-align:center;vertical-align:top;">
          <div style="display:inline-block;background:#fff;padding:5px;line-height:0;">
            <img src="${escapeHtml(ticket.qrUrl)}" width="68" height="68" alt="Ticket QR code" style="display:block;border:0;width:68px;height:68px;" />
          </div>
          <div style="padding-top:5px;font-family:'Courier New',monospace;font-size:8px;font-weight:bold;letter-spacing:1px;color:${accent};text-transform:uppercase;">${escapeHtml(ticket.label)} · ${escapeHtml(ticket.seatType)}</div>
        </td>
      </tr>
    </table>`;
}

export function emailSubject(variant: EmailVariant, eventTitle: string) {
  if (variant === "waitlisted") return `You’re on the Bonkhouse waitlist for ${eventTitle}`;
  if (variant === "cancelled") return `Your Bonkhouse RSVP was cancelled`;
  if (variant === "reminder") return `Tomorrow: ${eventTitle}`;
  if (variant === "newsletter") return "You’re on the Bonkhouse list";
  return `Your Bonkhouse tickets for ${eventTitle}`;
}

export function renderNewsletterWelcomeEmail({ guestName, logoUrl, siteUrl }: Pick<BonkhouseEmailInput, "guestName" | "logoUrl"> & { siteUrl: string }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>You’re on the Bonkhouse list</title>
  </head>
  <body style="margin:0;padding:0;background:#080808;color:#f7f3e8;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Occasional screenings, strange cinema, and Sunday plans.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080808;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0b0b0b;border:1px solid #252525;">
            <tr><td height="8" style="height:8px;background:#ffd400;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr>
              <td style="padding:34px 36px 28px;">
                <img src="${escapeHtml(logoUrl)}" width="188" alt="Sunday Afternoon Bonkhouse" style="display:block;width:188px;max-width:100%;height:auto;border:0;" />
                <div style="margin-top:34px;display:inline-block;background:#ffd400;padding:8px 12px;color:#080808;font-family:'Courier New',monospace;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">Newsletter signup confirmed</div>
                <h1 style="margin:22px 0 14px;color:#f7f3e8;font-family:'Trebuchet MS',Verdana,sans-serif;font-size:40px;font-weight:700;line-height:1.08;letter-spacing:.6px;text-transform:uppercase;">YOU’RE ON<br />THE LIST.</h1>
                <p style="margin:0;color:#c9c5bc;font-size:16px;line-height:1.6;">Hi ${escapeHtml(guestName)}, thank you for joining the list. We’ll email you about future screenings when they come up.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 36px 34px;">
                <a href="${escapeHtml(siteUrl)}/screenings" style="display:inline-block;background:#ffd400;padding:13px 18px;color:#080808;font-family:'Courier New',monospace;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-decoration:none;text-transform:uppercase;">See upcoming screenings →</a>
              </td>
            </tr>
            <tr><td style="padding:0 36px 30px;color:#66635d;font-family:'Courier New',monospace;font-size:9px;line-height:1.6;letter-spacing:1px;text-transform:uppercase;">Sunday Afternoon Bonkhouse · Newsletter</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderBonkhouseEmail(input: BonkhouseEmailInput) {
  const theme = copy[input.variant];
  const showTickets = input.variant === "confirmed" || input.variant === "reminder";
  const ticketList = showTickets ? input.tickets.map((ticket) => ticketMarkup(ticket, theme.accent)).join("") : "";
  const action = input.variant === "cancelled"
    ? `<div style="font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#aaa69d;">Changed your mind? Return to the screening page to reserve again if seats remain.</div>`
    : input.variant === "waitlisted"
      ? `<div style="font-family:'Courier New',monospace;font-size:12px;line-height:1.6;color:#aaa69d;">No ticket is needed yet. If a seat opens, we’ll send a fresh confirmation with your QR code.</div>`
      : `<a href="${escapeHtml(input.cancelUrl)}" style="font-family:'Courier New',monospace;font-size:11px;font-weight:bold;letter-spacing:1px;color:#aaa69d;text-decoration:underline;text-transform:uppercase;">Can’t make it? Release your seats</a>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(emailSubject(input.variant, input.eventTitle))}</title>
  </head>
  <body style="margin:0;background:#171715;padding:0;color:#f8f3e7;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(theme.intro)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#171715;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0b0b0b;border:1px solid #252525;">
            <tr>
              <td style="height:7px;background:${theme.accent};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:30px 36px 18px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${escapeHtml(input.logoUrl)}" width="188" alt="Sunday Afternoon Bonkhouse" style="display:block;width:188px;max-width:100%;height:auto;border:0;" />
                    </td>
                    <td align="right" style="vertical-align:middle;font-family:'Courier New',monospace;font-size:10px;font-weight:bold;letter-spacing:1.4px;color:${theme.accent};text-transform:uppercase;">Admit one<br />Sunday</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 30px;">
                <span style="display:inline-block;background:${theme.accent};padding:8px 12px;font-family:'Courier New',monospace;font-size:11px;font-weight:bold;letter-spacing:1.5px;color:${theme.accentInk};text-transform:uppercase;">${theme.eyebrow}</span>
                <h1 style="margin:22px 0 14px;font-family:'Trebuchet MS',Verdana,sans-serif;font-size:40px;font-weight:700;letter-spacing:.6px;line-height:1.08;color:#f7f3e8;text-transform:uppercase;">${theme.headline}</h1>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.58;color:#c9c5bc;">Hi ${escapeHtml(input.guestName)}, ${theme.intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #292929;border-bottom:1px solid #292929;">
                  <tr>
                    <td style="padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
                      <div style="margin-bottom:8px;font-family:'Courier New',monospace;font-size:10px;font-weight:bold;letter-spacing:2px;color:${theme.accent};text-transform:uppercase;">The feature</div>
                      <div style="margin-bottom:14px;font-family:Impact,'Arial Narrow Bold',sans-serif;font-size:25px;line-height:1.1;color:#f7f3e8;text-transform:uppercase;">${escapeHtml(input.eventTitle)}</div>
                      <strong style="color:#fffaf0;">${escapeHtml(input.eventDate)}</strong><br />
                      <span style="font-size:14px;line-height:1.6;color:#aaa69e;">${escapeHtml(input.venue)}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${showTickets ? `
            <tr>
              <td style="padding:30px 36px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #363636;">
                  <tr>
                    <td style="padding:22px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="64" style="width:64px;vertical-align:middle;">
                            <table role="presentation" width="52" height="52" cellpadding="0" cellspacing="0" style="width:52px;height:52px;border:2px solid ${theme.accent};">
                              <tr><td align="center" style="font-family:'Courier New',monospace;font-size:24px;font-weight:bold;color:${theme.accent};">T</td></tr>
                            </table>
                          </td>
                          <td style="vertical-align:middle;">
                            <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:bold;letter-spacing:2px;color:${theme.accent};text-transform:uppercase;">Your ticket</div>
                            <div style="padding-top:5px;font-family:Impact,'Arial Narrow Bold',sans-serif;font-size:24px;line-height:1;color:#f7f3e8;text-transform:uppercase;">${input.tickets.length} ${input.tickets.length === 1 ? "seat" : "seats"}</div>
                            <div style="padding-top:6px;font-family:'Courier New',monospace;font-size:10px;color:#8f8b84;text-transform:uppercase;">Show this email at the door</div>
                          </td>
                        </tr>
                      </table>
                      <div style="margin-top:20px;border-top:1px dashed #3b3b3b;padding-top:18px;">
                        <div style="font-family:'Courier New',monospace;font-size:9px;font-weight:bold;letter-spacing:2px;color:#77736c;text-transform:uppercase;">Confirmation</div>
                        <div style="padding-top:5px;font-family:'Courier New',monospace;font-size:18px;font-weight:bold;letter-spacing:2px;color:${theme.accent};">${escapeHtml(input.confirmationCode)}</div>
                        <div style="padding-top:4px;">${ticketList}</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>` : ""}
            <tr>
              <td style="padding:10px 36px 28px;">
                <div style="border-left:3px solid ${theme.accent};padding:3px 0 3px 15px;">
                  <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:bold;letter-spacing:1.4px;color:${theme.accent};text-transform:uppercase;">Arrival notes</div>
                  <div style="padding-top:7px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#aaa69e;">${escapeHtml(input.arrivalInstructions)}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 26px;">${action}</td>
            </tr>
            <tr>
              <td style="padding:0 36px 30px;font-family:'Courier New',monospace;font-size:9px;line-height:1.6;letter-spacing:1px;color:#66635d;text-transform:uppercase;">Sunday Afternoon Bonkhouse · RSVP confirmation</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
