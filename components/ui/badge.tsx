import { cn } from "@/lib/utils";

export function Badge({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-white/20 bg-white/[0.08] px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.06em] text-ink",
        className
      )}
    >
      {children}
    </span>
  );
}
