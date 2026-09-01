import QRCode from "qrcode";
import { siteUrl } from "@/lib/utils";

export function makeTicketToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString("base64url");
}

export async function hashTicketToken(token: string) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("hex");
}

export async function ticketQrDataUrl(token: string) {
  return QRCode.toDataURL(ticketQrUrl(token), {
    margin: 1,
    width: 420,
    color: {
      dark: "#20160f",
      light: "#fff4df"
    }
  });
}

// Guests scan their own QR codes — send them to the public verification page,
// which links hosts onward to /admin/check-in.
export function ticketQrUrl(token: string) {
  return `${siteUrl()}/ticket?token=${encodeURIComponent(token)}`;
}

export async function ticketQrPngBuffer(token: string) {
  return QRCode.toBuffer(ticketQrUrl(token), {
    margin: 1,
    width: 420,
    color: {
      dark: "#20160f",
      light: "#fff4df"
    }
  });
}

// Seat allocation lives in the database (create_reservation_atomic) so it can
// run with the event row locked; do not reimplement it here.
