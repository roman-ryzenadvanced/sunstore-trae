"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, XCircle } from "lucide-react";

import { toast } from "@/components/toaster";

/**
 * Demo payment page — used by the T-Bank demo flow.
 *
 * When the backend is in DEMO mode (terminal key starts with "demo"), the
 * /checkout/init endpoint returns a payment URL pointing here. This page
 * simulates the bank's confirmation step: the customer clicks "Pay" and we
 * fire the webhook to the backend to confirm the order.
 *
 * No real card is charged. This exists so the full flow (init → redirect →
 * webhook → order confirmed) can be exercised end-to-end without a real
 * T-Bank test terminal.
 */
function DemoPaymentInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const order = sp.get("order") || "";
  const payment = sp.get("payment") || "";
  const [busy, setBusy] = useState<"success" | "fail" | null>(null);

  async function fireWebhook(outcome: "success" | "fail") {
    if (!order) {
      toast.error("Неверная ссылка", "Отсутствует номер заказа");
      return;
    }
    setBusy(outcome === "success" ? "success" : "fail");
    try {
      const payload = {
        TerminalKey: "demo_terminal_key_12345",
        OrderId: order,
        PaymentId: payment || ("demo-" + order),
        Status: outcome === "success" ? "CONFIRMED" : "REJECTED",
        Success: outcome === "success",
        ErrorCode: "0",
        Amount: 0,
        Demo: true
      };
      // Fire the same webhook T-Bank would fire.
      const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1").replace(/\/+$/, "");
      await fetch(`${apiBase}/webhooks/tbank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success(outcome === "success" ? "Оплата подтверждена (demo)" : "Оплата отклонена (demo)");
      router.push(`/checkout/status?status=${outcome === "success" ? "success" : "rejected"}&order=${encodeURIComponent(order)}`);
    } catch (e: any) {
      toast.error("Не удалось отправить webhook", e?.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="shell page-stack">
      <section className="checkout-card status-card status-card--pending" style={{ maxWidth: 620, margin: "40px auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 999,
            background: "var(--warning-soft)", color: "var(--warning)",
            display: "grid", placeItems: "center"
          }}>
            <CreditCard size={28} />
          </div>
        </div>
        <p className="eyebrow" style={{ textAlign: "center" }}>Demo Mode · T-Bank sandbox</p>
        <h1 style={{ textAlign: "center" }}>Имитация банковской страницы</h1>
        <p style={{ textAlign: "center", color: "var(--muted)", maxWidth: "48ch", margin: "0 auto" }}>
          Backend Sun Store работает в DEMO-режиме (терминал T-Bank — заглушка).
          Выберите исход оплаты — мы отправим тестовый webhook и обновим статус заказа.
          Реальная карта не спишется.
        </p>

        <div style={{ marginTop: 20, padding: 14, background: "var(--surface-tint-1)", borderRadius: 8, fontSize: 13, color: "var(--muted)" }}>
          <strong>Заказ:</strong> <code>{order}</code>
          {payment && <><br/><strong>Платёж:</strong> <code>{payment}</code></>}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center" }}>
          <button
            onClick={() => fireWebhook("success")}
            disabled={busy !== null}
            className="button button--success"
          >
            {busy === "success" ? <><Loader2 size={16} className="spin" /> Обработка…</> : <><CheckCircle2 size={16} /> Оплатить (успех)</>}
          </button>
          <button
            onClick={() => fireWebhook("fail")}
            disabled={busy !== null}
            className="button button--ghost"
          >
            {busy === "fail" ? <><Loader2 size={16} className="spin" /> Обработка…</> : <><XCircle size={16} /> Отклонить</>}
          </button>
        </div>

        <p style={{ marginTop: 18, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
          <Link href="/" style={{ textDecoration: "underline" }}>← Вернуться на главную</Link>
        </p>
      </section>
    </main>
  );
}

export default function DemoPaymentPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#888" }}>Загрузка…</div>}>
      <DemoPaymentInner />
    </Suspense>
  );
}
