import Link from "next/link";
import { hashTicketToken } from "@/lib/tickets";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils";

type TicketRow = {
  seat_type: string;
  status: string;
  checked_in_at: string | null;
  event_title: string | null;
  event_slug: string | null;
  event_starts_at: string | null;
  guest_name: string | null;
};

function Verdict({
  stamp,
  headline,
  body,
  tone
}: {
  stamp: string;
  headline: string;
  body: string;
  tone: "good" | "bad";
}) {
  return (
    <>
      <div
        className={`inline-block -rotate-3 border-4 px-5 py-3 font-display text-3xl uppercase tracking-wider sm:text-4xl ${
          tone === "good" ? "border-butter text-butter" : "border-red-500 text-red-500"
        }`}
      >
        {stamp}
      </div>
      <h1 className="mt-8 font-display text-5xl uppercase leading-[0.92] tracking-[-0.05em] text-white sm:text-6xl">
        {headline}
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">{body}</p>
    </>
  );
}

export default async function TicketPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  let ticket: TicketRow | null = null;

  if (token) {
    const supabase = await createClient();
    const tokenHash = await hashTicketToken(token);
    // RLS hides ticket rows from anon — verify_ticket is a security-definer
    // function that only answers for an exact token hash.
    const { data } = await supabase.rpc("verify_ticket", { p_token_hash: tokenHash });
    ticket = (Array.isArray(data) ? data[0] : data) ?? null;
  }

  const eventHref = ticket?.event_slug ? `/events/${ticket.event_slug}` : "/screenings";
  const guestName = ticket?.guest_name || "This guest";
  const cancelled = ticket?.status === "cancelled";
  const waitlisted = ticket?.status === "waitlisted" || ticket?.seat_type === "waitlist";

  return (
    <div className="club-container py-16">
      {!ticket ? (
        <Verdict
          stamp="Bogus ticket"
          headline="This QR is not one of ours"
          body="No ticket matches this code. If someone is waving this at the door, be suspicious. If it's your own ticket, try the QR in your confirmation email again or RSVP from the screenings page."
          tone="bad"
        />
      ) : cancelled ? (
        <Verdict
          stamp="Released"
          headline="This ticket was cancelled"
          body={`${guestName} released these seats. If that's you and you've changed your mind, you can RSVP again from the event page while seats remain.`}
          tone="bad"
        />
      ) : waitlisted ? (
        <Verdict
          stamp="In line"
          headline="Waitlisted, not seated (yet)"
          body={`${guestName} is on the waitlist. No seat is confirmed yet — if one opens up, a fresh confirmation email with a real ticket will arrive.`}
          tone="bad"
        />
      ) : (
        <Verdict
          stamp="Certified good little boy"
          headline="This ticket is legit"
          body={`${guestName} RSVP'd properly like a good little boy and holds a confirmed ${ticket.seat_type} seat${
            ticket.checked_in_at ? ", and has already been checked in at the gate" : ""
          }. Send them through.`}
          tone="good"
        />
      )}

      {ticket?.event_title ? (
        <div className="mt-8 border-l-4 border-butter/60 pl-5">
          <p className="font-display text-3xl uppercase text-white">{ticket.event_title}</p>
          {ticket.event_starts_at ? (
            <p className="mt-1 text-white/60">{formatEventDate(ticket.event_starts_at)}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <Link
          className="inline-flex h-12 items-center rounded-[3px] border border-butter bg-butter px-6 font-bebas text-2xl uppercase tracking-wider leading-none text-black hover:bg-[#ffe15a]"
          href={eventHref}
        >
          {ticket ? "Back to the event" : "See what's screening"}
        </Link>
        {token ? (
          <Link className="text-sm uppercase tracking-wide text-white/40 underline hover:text-white/70" href={`/admin/check-in?token=${encodeURIComponent(token)}`}>
            Working the door? Check in
          </Link>
        ) : null}
      </div>
    </div>
  );
}
