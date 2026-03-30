import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-2xl border border-white/12 bg-white/6 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/30 focus:bg-white/10",
        className
      )}
      {...props}
    />
  );
}
