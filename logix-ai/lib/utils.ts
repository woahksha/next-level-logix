import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely, resolving conflicts
 * (e.g. cn("p-2", "p-4") -> "p-4").
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupees, e.g. formatINR(45000) -> "₹45,000"
 */
export function formatINR(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parse the mock dataset's date strings, e.g. "19 Aug, 6:00 PM", into a
 * Date. A fixed reference year is used purely so the returned dates are
 * internally consistent and comparable with one another (the demo data
 * intentionally omits a year) — only relative comparisons (sooner/later,
 * hours-until) should be made against the result, not absolute "today"
 * checks.
 */
export function parseMockDateTime(value: string): Date | null {
  const match = value.match(
    /(\d{1,2})\s+([A-Za-z]{3,})[, ]+(\d{1,2}):(\d{2})\s*(AM|PM)?/i
  );
  if (!match) return null;
  const [, dayStr, monthStr, hourStr, minuteStr, meridiem] = match;
  const month = MONTHS[monthStr.slice(0, 3).toLowerCase()];
  if (month === undefined) return null;

  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (meridiem) {
    const isPM = meridiem.toUpperCase() === "PM";
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
  }

  return new Date(2000, month, parseInt(dayStr, 10), hour, minute);
}
