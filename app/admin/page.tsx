import Link from "next/link";
import { AdminEventForm } from "@/components/admin-event-form";
import { AdminSignIn } from "@/components/admin-sign-in";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email || params.signin || params.forbidden) {
    return (
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-black uppercase">Admin</p>
          <h1 className="font-display text-6xl leading-none">Back room entrance</h1>
          {params.forbidden ? <p className="mt-4 font-bold text-cherry">This email is not on the admin allowlist.</p> : null}
        </div>
        <AdminSignIn />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <AdminSignIn />
        <p className="mt-5 font-bold text-cherry">Signed in, but this email is not in `admin_profiles`.</p>
      </div>
    );
  }

  const { data: events } = await supabase
    .from("events")
    .select("id,title,starts_at,status,capacity_standard,capacity_overflow")
    .order("starts_at", { ascending: false })
    .limit(12);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase">Admin</p>
          <h1 className="font-display text-6xl leading-none">Dashboard</h1>
          <p className="mt-3 font-bold">Signed in as {user.email}</p>
        </div>
        <Link className={buttonVariants({ variant: "secondary" })} href="/admin/check-in">
          Door check-in
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section>
          <h2 className="font-display text-4xl">Screenings</h2>
          <div className="mt-5 grid gap-4">
            {(events || []).map((event) => (
              <Link
                className="rounded-[1.2rem] border-2 border-ink bg-white/70 p-4 shadow-[4px_4px_0_#20160f] transition hover:-translate-y-0.5"
                href={`/admin/events/${event.id}`}
                key={event.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-3xl">{event.title}</h3>
                  <Badge>{event.status}</Badge>
                </div>
                <p className="mt-2 text-sm font-bold">
                  {new Date(event.starts_at).toLocaleString()} · {event.capacity_standard} + {event.capacity_overflow}
                </p>
              </Link>
            ))}
            {!events?.length ? <p>No Supabase events yet. Create the first one.</p> : null}
          </div>
        </section>
        <AdminEventForm />
      </div>
    </div>
  );
}
