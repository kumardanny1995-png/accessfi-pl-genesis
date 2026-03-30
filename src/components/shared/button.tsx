import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    fullWidth?: boolean;
  }
>;

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[linear-gradient(135deg,#ff533d_0%,#ff9d2f_50%,#ffe083_100%)] text-ink shadow-arena hover:brightness-105",
  secondary: "border border-white/15 bg-white/8 text-white hover:bg-white/12",
  ghost: "border border-white/10 bg-transparent text-white/80 hover:bg-white/8 hover:text-white",
  danger: "bg-signal-red text-white hover:bg-[#ff6d5b]"
};

export function Button({
  children,
  className,
  variant = "primary",
  fullWidth,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold tracking-[0.18em] uppercase transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
