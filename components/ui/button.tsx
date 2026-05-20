import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "grindhouse-button focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-5 py-2.5 text-xs font-black uppercase tracking-[0.02em] transition hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-butter bg-butter text-black shadow-[0_0_26px_rgba(255,212,0,0.18)] hover:bg-[#ffe15a]",
        secondary: "border-butter bg-transparent text-butter hover:bg-butter hover:text-black",
        quiet: "border-white/25 bg-white/5 text-ink hover:border-butter hover:text-butter",
        ghost: "border-transparent bg-transparent text-ink hover:border-white/25 hover:bg-white/5"
      },
      size: {
        default: "h-11",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-7 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
