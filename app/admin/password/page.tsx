import Link from "next/link";
import { AdminPasswordForm } from "@/components/admin-password-form";
import { requireAdmin } from "@/lib/admin";

export default async function AdminPasswordPage() {
  const { user } = await requireAdmin();

  return (
    <div className="mx-auto grid max-w-2xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-black uppercase">Admin</p>
        <h1 className="font-display text-6xl leading-none">Set your password</h1>
        <p className="mt-3 font-bold">For {user.email}. Signed in on any device, this password gets you straight in.</p>
      </div>
      <AdminPasswordForm />
      <Link className="text-sm font-bold underline underline-offset-4" href="/admin">
        Back to the dashboard
      </Link>
    </div>
  );
}
