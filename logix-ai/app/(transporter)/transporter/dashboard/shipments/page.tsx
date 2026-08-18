"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageSearch } from "lucide-react";
import { ShipmentCard } from "@/components/transporter/ShipmentCard";
import {
  ShipmentFilters,
  DEFAULT_SHIPMENT_FILTERS,
  type ShipmentFilterValues,
} from "@/components/transporter/ShipmentFilters";
import { mapOrderToShipmentListing } from "@/lib/transporter-mappers";
import type { ShipmentListing } from "@/types/transporter";

export default function AvailableShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ShipmentFilterValues>(DEFAULT_SHIPMENT_FILTERS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/orders?status=PENDING")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setShipments((data.orders ?? []).map(mapOrderToShipmentListing));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load available shipments.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loaded = shipments ?? [];

  const truckTypeOptions = useMemo(
    () => Array.from(new Set(loaded.map((s) => s.truckTypeRequired))).sort(),
    [loaded]
  );

  const filteredShipments = useMemo(() => {
    return loaded.filter((shipment) => {
      if (filters.truckType !== "all" && shipment.truckTypeRequired !== filters.truckType) {
        return false;
      }
      if (filters.maxDistance !== "any" && shipment.distanceKm > Number(filters.maxDistance)) {
        return false;
      }
      if (filters.minRate !== "any" && shipment.recommendedRate < Number(filters.minRate)) {
        return false;
      }
      // Deadline filter is skipped for real orders — dates now carry a
      // real year/time, so the mock dataset's "hours until" bucketing
      // (built for year-less demo strings) doesn't apply here.
      return true;
    });
  }, [filters, loaded]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Available Shipments</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {shipments === null ? "Loading…" : `${loaded.length} loads currently open for bidding.`}
        </p>
      </div>

      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

      <ShipmentFilters
        values={filters}
        onChange={setFilters}
        truckTypeOptions={truckTypeOptions}
        resultCount={filteredShipments.length}
      />

      {shipments !== null && filteredShipments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center">
          <PackageSearch className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-neutral-600">
            No loads match your current filters.
          </p>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_SHIPMENT_FILTERS)}
            className="mt-3 text-sm font-semibold text-skyline-600 hover:text-skyline-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredShipments.map((shipment) => (
            <ShipmentCard key={shipment.id} shipment={shipment} />
          ))}
        </div>
      )}
    </div>
  );
}
