"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShipmentFilterValues {
  truckType: string;
  maxDistance: string;
  minRate: string;
  deadline: string;
}

export const DEFAULT_SHIPMENT_FILTERS: ShipmentFilterValues = {
  truckType: "all",
  maxDistance: "any",
  minRate: "any",
  deadline: "any",
};

export const DISTANCE_OPTIONS = [
  { value: "any", label: "Any distance" },
  { value: "150", label: "Up to 150 km" },
  { value: "300", label: "Up to 300 km" },
  { value: "600", label: "Up to 600 km" },
];

export const RATE_OPTIONS = [
  { value: "any", label: "Any rate" },
  { value: "5000", label: "₹5,000+" },
  { value: "10000", label: "₹10,000+" },
  { value: "20000", label: "₹20,000+" },
];

export const DEADLINE_OPTIONS = [
  { value: "any", label: "Any deadline" },
  { value: "24", label: "Within 24 hrs" },
  { value: "48", label: "Within 2 days" },
  { value: "9999", label: "Later this week" },
];

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex min-w-[9.5rem] flex-1 flex-col gap-1 sm:flex-none">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm font-medium text-navy-800 outline-none transition-colors focus:border-skyline-400"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ShipmentFilters({
  values,
  onChange,
  truckTypeOptions,
  resultCount,
}: {
  values: ShipmentFilterValues;
  onChange: (next: ShipmentFilterValues) => void;
  truckTypeOptions: string[];
  resultCount: number;
}) {
  const isFiltered =
    values.truckType !== "all" ||
    values.maxDistance !== "any" ||
    values.minRate !== "any" ||
    values.deadline !== "any";

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-neutral-500">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </div>
        {isFiltered && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_SHIPMENT_FILTERS)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-skyline-600 hover:text-skyline-700"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select
          label="Truck type"
          value={values.truckType}
          onChange={(v) => onChange({ ...values, truckType: v })}
          options={[{ value: "all", label: "All truck types" }, ...truckTypeOptions.map((t) => ({ value: t, label: t }))]}
        />
        <Select
          label="Distance"
          value={values.maxDistance}
          onChange={(v) => onChange({ ...values, maxDistance: v })}
          options={DISTANCE_OPTIONS}
        />
        <Select
          label="Rate"
          value={values.minRate}
          onChange={(v) => onChange({ ...values, minRate: v })}
          options={RATE_OPTIONS}
        />
        <Select
          label="Deadline"
          value={values.deadline}
          onChange={(v) => onChange({ ...values, deadline: v })}
          options={DEADLINE_OPTIONS}
        />
      </div>

      <p className={cn("mt-3 text-xs font-medium", resultCount === 0 ? "text-rose-600" : "text-neutral-500")}>
        {resultCount} {resultCount === 1 ? "load" : "loads"} match{resultCount === 1 ? "es" : ""} your filters
      </p>
    </div>
  );
}
