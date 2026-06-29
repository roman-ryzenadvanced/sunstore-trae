"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";

import { submitContactForm } from "@/lib/multi-site/api";
import { toast } from "@/components/toaster";

export default function ContactsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Заполните имя, email и сообщение");
      return;
    }
    if (message.trim().length < 5) {
      toast.error("Сообщение слишком короткое");
      return;
    }
    setBusy(true);
    const r = await submitContactForm({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });
    setBusy(false);
    if (r.ok) {
      setSent(true);
      toast.success("Сообщение отправлено", "Мы свяжемся с вами в течение рабочего дня");
      setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage("");
    } else {
      toast.error("Не удалось отправить", r.error || "Попробуйте позже или напишите на почту");
    }
  }

  return (
    <main className="shell page-stack">
      <section className="section-block">
        <div className="section-heading section-heading--page">
          <div>
            <p className="eyebrow">Контакты</p>
            <h1>Свяжитесь с нами</h1>
          </div>
        </div>
        <p style={{ color: "var(--muted)", maxWidth: "60ch", marginTop: -8, fontSize: "1.02rem", lineHeight: 1.7 }}>
          Ответим на вопросы по подбору солнечной электростанции, поможем рассчитать
          мощность и подберём оборудование под ваш бюджет.
        </p>
      </section>

      <section className="checkout-grid" style={{ gap: 24 }}>
        <form onSubmit={submit} className="checkout-card info-card">
          {sent && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 14, background: "var(--success-soft)", borderRadius: 8, color: "var(--success)", fontWeight: 600 }}>
              <CheckCircle2 size={20} /> Спасибо! Сообщение получено — ответим в течение рабочего дня.
            </div>
          )}
          <h3 style={{ marginTop: 0 }}>Форма обратной связи</h3>
          <div className="field-grid">
            <label className="field">
              <span>Имя *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} placeholder="Иван Иванов" />
            </label>
            <label className="field">
              <span>Email *</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" maxLength={250} placeholder="you@example.com" />
            </label>
            <label className="field">
              <span>Телефон</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" maxLength={40} placeholder="+7 999 000-00-00" />
            </label>
            <label className="field">
              <span>Тема</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Подбор инвертора" />
            </label>
          </div>
          <label className="field">
            <span>Сообщение *</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={5} maxLength={8000} rows={6} placeholder="Здравствуйте! Мне нужна солнечная электростанция для дачи…"/>
          </label>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="submit" className="button button--primary" disabled={busy}>
              {busy ? <><Loader2 size={16} className="spin" /> Отправка…</> : <><Send size={16} /> Отправить</>}
            </button>
          </div>
        </form>

        <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div className="mini-card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 12px" }}>Контактные данные</h3>
            <div style={{ display: "grid", gap: 12, color: "var(--muted)", fontSize: "0.92rem" }}>
              <p style={{ display: "flex", alignItems: "center", gap: 10 }}><Phone size={16} /> +7 800 000-00-00 (бесплатно по РФ)</p>
              <p style={{ display: "flex", alignItems: "center", gap: 10 }}><Mail size={16} /> hello@sunstore.example</p>
              <p style={{ display: "flex", alignItems: "center", gap: 10 }}><MapPin size={16} /> Москва, ул. Солнечная, 1</p>
            </div>
          </div>
          <div className="mini-card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 12px" }}>Режим работы</h3>
            <div style={{ display: "grid", gap: 6, color: "var(--muted)", fontSize: "0.9rem" }}>
              <p>Пн–Пт: 9:00–20:00 МСК</p>
              <p>Сб: 10:00–18:00 МСК</p>
              <p>Вс: выходной</p>
              <p style={{ marginTop: 6, fontSize: "0.82rem", color: "var(--muted)" }}>
                Заявки с сайта принимаются круглосуточно.
              </p>
            </div>
          </div>
          <div className="mini-card" style={{ padding: 20, background: "var(--brand-soft)", borderColor: "var(--brand)" }}>
            <h3 style={{ margin: "0 0 8px", color: "var(--brand-dark)" }}>Реквизиты</h3>
            <p style={{ fontSize: "0.86rem", color: "var(--text)", lineHeight: 1.6, margin: 0 }}>
              ООО «Сан Сторе»<br/>
              ИНН 7700000000 · КПП 770000000<br/>
              ОГРН 1157700000000<br/>
              р/с 40702810000000000000
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
