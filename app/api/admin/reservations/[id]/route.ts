import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ok, supabase } = await isAdminRequest();

  if (!ok) {
    return NextResponse.json({ error: "Admin sign in required." }, { status: 401 });
  }

  const { id } = await params;

  const { data: ticketRows } = await supabase
    .from("tickets")
    .select("id")
    .eq("reservation_id", id);
  const ticketIds = (ticketRows || []).map((ticket) => ticket.id);

  if (ticketIds.length) {
    await supabase.from("checkins").delete().in("ticket_id", ticketIds);
  }
  await supabase.from("waitlist_entries").delete().eq("reservation_id", id);
  await supabase.from("tickets").delete().eq("reservation_id", id);
  const { data: deleted, error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", id)
    .select("id");

  if (error || !deleted?.length) {
    return NextResponse.json(
      { error: "Could not remove the reservation. Check the admin delete policies in Supabase." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
