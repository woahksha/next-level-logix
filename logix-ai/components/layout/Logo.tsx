import { Truck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const textColor = variant === "dark" ? "text-navy-800" : "text-white";

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 group", className)}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-skyline-500 to-navy-700 text-white shadow-soft transition-transform group-hover:scale-105">
        <Truck className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className={cn("text-lg font-bold tracking-tight", textColor)}>
        Logix<span className="text-skyline-500">AI</span>
      </span>
    </Link>
  );
}
