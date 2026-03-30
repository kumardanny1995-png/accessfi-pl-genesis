import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-12 w-full rounded-2xl border border-white/12 bg-ink px-4 text-sm text-white outline-none transition focus:border-white/30",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
