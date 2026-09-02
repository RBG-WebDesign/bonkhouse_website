import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { emailCancellationOutcome, type CancellationRow } from "@/lib/waitlist";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ok, supabase } = await isAdminRequest();

  if (!ok) {
    return NextResponse.json({ error: "Admin sign in required." }, { status: 401 });
  }

  const { id } = await params;

  // The database function marks the row cancelled (so the Google Sheet hears
  // about it), deletes it, and promotes the waitlist into the freed seats.
  const { data, error } = await supabase.rpc("admin_remove_reservation", { reservation_uuid: id });
  const rows = (Array.isArray(data) ? data : []) as CancellationRow[];

  if (error || !rows.some((row) => row.kind === "removed")) {
    return NextResponse.json(
      { error: "Could not remove the reservation. Check that the 202609030001 migration has been applied." },
      { status: 500 }
    );
  }

  // The removed guest gets no email (the host decided); promoted guests do.
  await emailCancellationOutcome(supabase, rows);

  return NextResponse.json({ ok: true, promoted: rows.filter((row) => row.kind === "promoted").length });
}
