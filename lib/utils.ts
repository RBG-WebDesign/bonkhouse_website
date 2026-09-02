import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Screenings happen in Los Angeles; the server (Netlify) runs in UTC.
const LA = "America/Los_Angeles";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: LA,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: LA,
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

// Emails render on the recipient's device — a localhost URL is never reachable there,
// even when the email itself is sent from a dev server.
export function emailSiteUrl() {
  const url = siteUrl();
  return url.includes("localhost") ? "https://bonkhouse.com" : url;
}

export function publicAsset(path: string | null | undefined) {
  if (!path) {
    return "";
  }

  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath;
}
