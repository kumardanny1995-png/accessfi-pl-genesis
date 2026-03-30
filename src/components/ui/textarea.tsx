import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
}) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#4fdbc8]/30 focus:bg-white/8",
        className
      )}
      {...props}
    />
  );
}
