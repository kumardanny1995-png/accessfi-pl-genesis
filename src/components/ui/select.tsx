import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-14 w-full rounded-[1.4rem] border border-white/10 bg-[#101524] px-4 text-sm text-white outline-none transition focus:border-[#4fdbc8]/30",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
