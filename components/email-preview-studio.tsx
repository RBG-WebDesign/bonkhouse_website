"use client";

import { useMemo, useState } from "react";
import { emailSubject, EmailVariant, renderBonkhouseEmail, renderNewsletterWelcomeEmail } from "@/lib/email-templates";

const variants: Array<{ id: EmailVariant; label: string; note: string }> = [
  { id: "confirmed", label: "Tickets confirmed", note: "Sent immediately after a successful RSVP" },
  { id: "waitlisted", label: "Waitlist", note: "Sent when standard and overflow seats are full" },
  { id: "cancelled", label: "Cancellation", note: "Confirms that the seats were released" },
  { id: "reminder", label: "Event reminder", note: "A day-before arrival reminder" },
  { id: "newsletter", label: "Newsletter welcome", note: "A simple opt-in message, never a ticket" }
];

const sampleTitle = "DEATH TO BONKHOUSE LONG LIVE THE NEW FLESH - VIDEODROME/SOCIETY DOUBLE FEATURE";

export function EmailPreviewStudio({ initialVariant = "confirmed" }: { initialVariant?: EmailVariant }) {
  const [variant, setVariant] = useState<EmailVariant>(initialVariant);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [guestName, setGuestName] = useState("Jane");

  const html = useMemo(
    () => variant === "newsletter" ? renderNewsletterWelcomeEmail({
      guestName: guestName.trim() || "Guest",
      logoUrl: "/email-masthead.png",
      siteUrl: "http://localhost:3000"
    }) : renderBonkhouseEmail({
      variant,
      guestName: guestName.trim() || "Guest",
      eventTitle: sampleTitle,
      eventDate: "Sunday, October 18, 2026 · 1:00 PM",
      venue: "Glorya Kaufman Community Center · 10858 Culver Blvd, Culver City, CA",
      arrivalInstructions: "Enter through the side gate. The gate closes at 1:20 PM. If it is closed, text the host number included in your confirmation.",
      cancelUrl: "#cancel-preview",
      logoUrl: "/email-masthead.png",
      confirmationCode: "BONK-018-JS",
      tickets: [
        { label: "Ticket 01", seatType: "Standard", qrUrl: "/email-qr-placeholder.svg" },
        { label: "Ticket 02", seatType: "Standard", qrUrl: "/email-qr-placeholder.svg" }
      ]
    }),
    [guestName, variant]
  );

  return (
    <div className="min-h-screen bg-[#080806] px-4 py-10 text-[#f8f3e7] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8 border-b border-[#353228] pb-7">
          <div className="font-special text-[10px] font-bold uppercase tracking-[0.26em] text-[#ffd400]">Bonkhouse communications lab</div>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-bebas text-5xl uppercase leading-none tracking-[0.025em] sm:text-7xl">Email Preview Studio</h1>
              <p className="mt-3 max-w-2xl font-special text-sm leading-6 text-[#aaa69d]">Pick a message, switch screen sizes, and annotate anything you want changed. These previews use the production email renderer.</p>
            </div>
            <div className="flex w-fit border border-[#4a463a] bg-[#11110e] p-1 font-special text-[11px] font-bold uppercase tracking-wider">
              {(["desktop", "mobile"] as const).map((size) => (
                <button key={size} type="button" onClick={() => setDevice(size)} className={`px-4 py-2 transition ${device === size ? "bg-[#ffd400] text-black" : "text-[#aaa69d] hover:text-white"}`}>
                  {size}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside>
            <div className="sticky top-6 space-y-6">
              <div>
                <div className="mb-3 font-special text-[10px] font-bold uppercase tracking-[0.22em] text-[#77736b]">Message state</div>
                <div className="space-y-2">
                  {variants.map((item, index) => (
                    <button key={item.id} type="button" onClick={() => setVariant(item.id)} className={`w-full border p-4 text-left transition ${variant === item.id ? "border-[#ffd400] bg-[#1a180e]" : "border-[#302e28] bg-[#10100e] hover:border-[#5a5548]"}`}>
                      <span className="font-special text-[9px] font-bold text-[#77736b]">0{index + 1}</span>
                      <span className={`mt-2 block font-bebas text-2xl uppercase tracking-wide ${variant === item.id ? "text-[#ffd400]" : "text-[#f8f3e7]"}`}>{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#928e85]">{item.note}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block font-special text-[10px] font-bold uppercase tracking-[0.22em] text-[#77736b]">Sample guest name</span>
                <input value={guestName} onChange={(event) => setGuestName(event.target.value)} className="focus-ring w-full border border-[#403c32] bg-[#0c0c0a] px-3 py-3 font-special text-sm text-white" />
              </label>

              <div className="border-l-2 border-[#ff5138] pl-4 font-special text-[11px] leading-5 text-[#8e8a82]">
                Preview only. Nothing on this page sends an email or changes an RSVP.
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="overflow-hidden rounded-xl border border-[#39362e] bg-[#242421] shadow-[0_28px_90px_rgba(0,0,0,.55)]">
              <div className="border-b border-[#3d3a33] bg-[#2d2d29] px-5 py-4">
                <div className="grid gap-3 text-sm sm:grid-cols-[70px_1fr]">
                  <div className="font-special text-[10px] font-bold uppercase tracking-wider text-[#8c887f]">From</div>
                  <div className="font-medium text-[#eee9dd]">Sunday Afternoon Bonkhouse &lt;onboarding@resend.dev&gt;</div>
                  <div className="font-special text-[10px] font-bold uppercase tracking-wider text-[#8c887f]">Subject</div>
                  <div className="font-medium text-white">{emailSubject(variant, sampleTitle)}</div>
                </div>
              </div>
              <div className="email-preview-stage overflow-auto bg-[radial-gradient(circle_at_50%_0%,#444038,#171715_45%)] px-3 py-8 sm:px-8">
                <div className={`mx-auto overflow-hidden transition-[max-width] duration-300 ${device === "mobile" ? "max-w-[390px]" : "max-w-[760px]"}`}>
                  <iframe title={`${variant} email preview`} srcDoc={html} className="h-[980px] w-full border-0 bg-[#171715]" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
