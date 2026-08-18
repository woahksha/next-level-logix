import type { OrderStatus } from "@/types/shipper";

export const statusTone: Record<OrderStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  PENDING: "warning",
  BID_ACCEPTED: "info",
  IN_TRANSIT: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export const statusLabel: Record<OrderStatus, string> = {
  PENDING: "Open for bids",
  BID_ACCEPTED: "Transporter assigned",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
