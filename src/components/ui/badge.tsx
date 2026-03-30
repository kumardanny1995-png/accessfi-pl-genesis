import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils/cn";

const tones = {
  safe: "bg-[#04b4a2]/12 text-[#4fdbc8] border-[#04b4a2]/20",
  caution: "bg-[#e0c1a3]/12 text-[#e0c1a3] border-[#e0c1a3]/20",
  risky: "bg-[#ff716c]/12 text-[#ff9a95] border-[#ff716c]/22",
  not_recommended: "bg-[#ff716c]/16 text-[#ff716c] border-[#ff716c]/26",
  neutral: "bg-white/8 text-white/72 border-white/10"
} as const;

export function Badge({
  children,
  className,
  tone = "neutral",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
