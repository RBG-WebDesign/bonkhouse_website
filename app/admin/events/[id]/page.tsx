import { Download } from "lucide-react";
import { InviteCodeForm } from "@/components/invite-code-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin";

export default async function AdminEventPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  const { data: attendees } = await supabase
    .from("reservations")
    .select("id,guest_name,guest_email,status,quantity,created_at,tickets(id,seat_type,status,checked_in_at)")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  if (!event) {
    return <div className="mx-auto max-w-4xl px-4 py-10">Event not found.</div>;
  }

  const counts = (attendees || []).reduce(
    (acc, reservation: any) => {
      reservation.tickets?.forEach((ticket: any) => {
        acc.total += 1;
        acc[ticket.seat_type as "standard" | "overflow" | "waitlist"] += 1;
        if (ticket.checked_in_at) {
          acc.checkedIn += 1;
        }
      });
      return acc;
    },
    { total: 0, standard: 0, overflow: 0, waitlist: 0, checkedIn: 0 }
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase">Admin screening</p>
          <h1 className="font-display text-6xl leading-none">{event.title}</h1>
        </div>
        <a className={buttonVariants({ variant: "secondary" })} href={`/api/admin/events/${id}/attendees`}>
          <Download size={18} />
          Export CSV
        </a>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-5">
        {[
          ["Total", counts.total],
          ["Standard", counts.standard],
          ["Overflow", counts.overflow],
          ["Waitlist", counts.waitlist],
          ["Checked in", counts.checkedIn]
        ].map(([label, value]) => (
          <div className="rounded-2xl border-2 border-ink bg-white/70 p-4" key={label}>
            <p className="text-xs font-black uppercase">{label}</p>
            <p className="font-display text-4xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.75fr]">
        <section className="rounded-[1.4rem] border-2 border-ink bg-white/70 p-5 shadow-sticker">
          <h2 className="font-display text-4xl">Guestlist</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="p-3">Guest</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Tickets</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(attendees || []).map((reservation: any) => (
                  <tr className="border-b border-ink/20" key={reservation.id}>
                    <td className="p-3 font-bold">{reservation.guest_name}</td>
                    <td className="p-3">{reservation.guest_email}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {reservation.tickets?.map((ticket: any) => (
                          <Badge key={ticket.id}>{ticket.seat_type}{ticket.checked_in_at ? " checked" : ""}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">{reservation.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <InviteCodeForm eventId={id} />
      </div>
    </div>
  );
}
