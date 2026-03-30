import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils/cn";

export function Panel({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-panel/90 bg-panel p-5 shadow-arena backdrop-blur",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
