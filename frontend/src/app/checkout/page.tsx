import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Контактные данные и сводка заказа перед оплатой через T-Bank.",
  robots: { index: false, follow: false }
};

export default function CheckoutPage() {
  return (
    <div className="shell page-stack">
      <CheckoutForm />
    </div>
  );
}
