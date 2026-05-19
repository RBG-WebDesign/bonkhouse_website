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
  return QRCode.toDataURL(`${siteUrl()}/admin/check-in?token=${encodeURIComponent(token)}`, {
    margin: 1,
    width: 420,
    color: {
      dark: "#20160f",
      light: "#fff4df"
    }
  });
}

export function ticketQrUrl(token: string) {
  return `${siteUrl()}/admin/check-in?token=${encodeURIComponent(token)}`;
}

export function allocateSeatType(index: number, standardCapacity = 100, overflowCapacity = 20) {
  if (index < standardCapacity) {
    return "standard";
  }

  if (index < standardCapacity + overflowCapacity) {
    return "overflow";
  }

  return "waitlist";
}
