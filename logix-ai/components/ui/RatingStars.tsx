import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  score,
  size = "sm",
  showScore = true,
}: {
  score: number;
  size?: "sm" | "md";
  showScore?: boolean;
}) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  const rounded = Math.round(score);

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              iconSize,
              i < rounded ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"
            )}
          />
        ))}
      </span>
      {showScore && (
        <span className="text-sm font-semibold text-navy-800">{score.toFixed(1)}</span>
      )}
    </span>
  );
}
