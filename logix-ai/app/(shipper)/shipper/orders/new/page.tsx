import { OrderForm } from "@/components/shipper/OrderForm";

export default function NewOrderPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Post a Shipment</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Fill in your shipment details — distance is calculated automatically and your order
          becomes visible to verified transporters as soon as you post it.
        </p>
      </div>
      <OrderForm />
    </div>
  );
}
