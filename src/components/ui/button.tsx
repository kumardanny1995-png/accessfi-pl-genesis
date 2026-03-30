import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#00677f_0%,#00d1ff_100%)] text-white shadow-[0_18px_34px_rgba(0,103,127,0.18)] hover:opacity-95",
  secondary:
    "bg-[linear-gradient(135deg,#04b4a2_0%,#71f8e4_100%)] text-[#03231f] shadow-[0_18px_34px_rgba(4,180,162,0.14)] hover:opacity-95",
  outline: "border border-white/12 bg-white/4 text-white hover:bg-white/8",
  ghost: "bg-transparent text-white/72 hover:bg-white/6 hover:text-white",
  danger: "bg-[#ff716c] text-white hover:bg-[#ff827c]"
};

export function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold tracking-[0.18em] uppercase transition duration-200 disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
