import { CheckInPanel } from "@/components/check-in-panel";
import { requireAdmin } from "@/lib/admin";

export default async function CheckInPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase">Admin</p>
      <h1 className="font-display text-6xl leading-none">Check guests in</h1>
      <p className="mt-4 text-lg leading-8">
        Scan a ticket QR with the phone camera or paste the token here. Valid tickets are marked as checked in once.
      </p>
      <div className="mt-8">
        <CheckInPanel initialToken={token} />
      </div>
    </div>
  );
}
