import { cn } from "@/lib/utils/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">{eyebrow}</p>
      <h2 className="max-w-xl text-3xl font-black uppercase leading-none tracking-[0.03em] text-cream">
        {title}
      </h2>
      {description ? <p className="max-w-xl text-sm leading-6 text-white/70">{description}</p> : null}
    </div>
  );
}
