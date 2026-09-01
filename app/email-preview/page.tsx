import type { Metadata } from "next";
import { EmailPreviewStudio } from "@/components/email-preview-studio";
import type { EmailVariant } from "@/lib/email-templates";

export const metadata: Metadata = {
  title: "Email Preview Studio | Sunday Afternoon Bonkhouse"
};

const validVariants = new Set<EmailVariant>(["confirmed", "waitlisted", "cancelled", "reminder", "newsletter"]);

export default async function EmailPreviewPage({
  searchParams
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const requestedVariant = (await searchParams).variant;
  const initialVariant = validVariants.has(requestedVariant as EmailVariant)
    ? (requestedVariant as EmailVariant)
    : "confirmed";

  return <EmailPreviewStudio initialVariant={initialVariant} />;
}
