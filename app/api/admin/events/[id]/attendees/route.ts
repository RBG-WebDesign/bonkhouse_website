import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ok, supabase } = await isAdminRequest();

  if (!ok) {
    return NextResponse.json({ error: "Admin sign in required." }, { status: 401 });
  }

  const { id } = await params;
  const { data } = await supabase
    .from("reservations")
    .select("guest_name,guest_email,status,quantity,tickets(seat_type,status,checked_in_at)")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  const header = ["name", "email", "reservation_status", "quantity", "ticket_statuses"].join(",");
  const rows = (data || []).map((reservation: any) => {
    const ticketStatuses = (reservation.tickets || [])
      .map((ticket: any) => `${ticket.seat_type}:${ticket.status}${ticket.checked_in_at ? ":checked" : ""}`)
      .join(" | ");
    return [
      csv(reservation.guest_name),
      csv(reservation.guest_email),
      csv(reservation.status),
      reservation.quantity,
      csv(ticketStatuses)
    ].join(",");
  });

  return new Response([header, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="bonkhouse-attendees-${id}.csv"`
    }
  });
}

function csv(value: string) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}
