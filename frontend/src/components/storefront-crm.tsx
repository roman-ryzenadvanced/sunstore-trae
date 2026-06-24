"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { publicContact, publicSubscribe } from "@/lib/multi-site/api";
import { toast } from "@/components/toaster";

/**
 * Contact form + newsletter subscribe widget rendered on public storefront
 * pages.  All submissions hit the public CRM endpoints
 *   POST /api/v1/sites/:slug/contact
 *   POST /api/v1/sites/:slug/subscribe
 * and flow into the super-admin Inbox / Mailing-list tabs.
 */
export function StorefrontContact({ slug, accent }: { slug: string; accent?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Заполните имя, email и сообщение");
      return;
    }
    setBusy(true);
    try {
      await publicContact(slug, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim() || "Обращение с сайта",
        message: message.trim(),
      });
      toast.success("Сообщение отправлено!", "Мы свяжемся с вами в ближайшее время");
      setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage("");
    } catch (e: any) {
      toast.error("Ошибка отправки", e?.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="site-storefront__contact" id="contact" style={{ borderTop: `2px solid ${accent || "#00ff88"}` }}>
      <h2 className="site-storefront__section-title">Связаться с нами</h2>
      <p className="muted" style={{ marginBottom: 16 }}>Оставьте сообщение — мы ответим в течение рабочего дня.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя *" className="site-storefront__input" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email" className="site-storefront__input" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" className="site-storefront__input" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Тема" className="site-storefront__input" />
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Сообщение *" rows={4} className="site-storefront__input" style={{ fontFamily: "inherit" }} />
        <button type="submit" disabled={busy} className="site-storefront__cta" style={{ justifySelf: "start" }}>
          {busy ? "Отправка…" : <><Send size={14} /> Отправить</>}
        </button>
      </form>
    </section>
  );
}

/**
 * Newsletter subscribe footer widget.
 */
export function StorefrontSubscribe({ slug, accent }: { slug: string; accent?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error("Введите email"); return; }
    setBusy(true);
    try {
      await publicSubscribe(slug, { email: email.trim(), name: name.trim() || undefined });
      toast.success("Подписка оформлена!", "Спасибо — ждите новостей");
      setEmail(""); setName("");
    } catch (e: any) {
      toast.error("Ошибка подписки", e?.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="site-storefront__newsletter" style={{ borderColor: accent || "#00ff88" }}>
      <Mail size={18} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Подпишитесь на рассылку</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.7 }}>Новости, акции и специальные предложения.</p>
      </div>
      <form onSubmit={subscribe} style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" className="site-storefront__input" style={{ width: 100 }} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="site-storefront__input" style={{ width: 160 }} />
        <button type="submit" disabled={busy} className="site-storefront__cta" style={{ padding: "6px 16px" }}>
          {busy ? "…" : "OK"}
        </button>
      </form>
    </div>
  );
}
