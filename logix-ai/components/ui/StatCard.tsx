import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "navy",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: "navy" | "skyline" | "emerald";
}) {
  const accentStyles = {
    navy: "bg-navy-50 text-navy-700",
    skyline: "bg-skyline-50 text-skyline-700",
    emerald: "bg-emerald-50 text-emerald-700",
  } as const;

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {label}
        </span>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", accentStyles[accent])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-navy-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
