import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
}) {
  return (
    <input
      className={cn(
        "min-h-14 w-full rounded-[1.4rem] border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#4fdbc8]/30 focus:bg-white/8",
        className
      )}
      {...props}
    />
  );
}
