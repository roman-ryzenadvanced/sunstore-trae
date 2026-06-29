"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Inbox, LogOut, Mail, MailOpen, RefreshCw, Trash2 } from "lucide-react";

import {
  listContactSubmissions,
  setContactRead,
  deleteContactSubmission,
  type ContactSubmission,
} from "@/lib/multi-site/api";
import { useCentralAuthStore } from "@/lib/multi-site/store";
import { toast } from "@/components/toaster";

import "../central.css";

export default function CentralContactsInboxPage() {
  const router = useRouter();
  const token = useCentralAuthStore((s) => s.token);
  const clear = useCentralAuthStore((s) => s.clear);

  const [items, setItems] = useState<ContactSubmission[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [active, setActive] = useState<ContactSubmission | null>(null);

  useEffect(() => {
    if (token === null) {
      router.push("/central/login");
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await listContactSubmissions(token, { unreadOnly: filter === "unread", limit: 200 });
      setItems(r.items || []);
      setUnreadCount(r.unread_count || 0);
    } catch (e: any) {
      toast.error("Не удалось загрузить", e?.message);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  async function openMessage(item: ContactSubmission) {
    setActive(item);
    if (!item.is_read && token) {
      try {
        await setContactRead(token, item.id, true);
        setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, is_read: true } : p)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch { /* ignore */ }
    }
  }

  async function markUnread(item: ContactSubmission) {
    if (!token) return;
    try {
      await setContactRead(token, item.id, false);
      setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, is_read: false } : p)));
      setUnreadCount((c) => c + 1);
      toast.info("Пометено как непрочитанное");
    } catch (e: any) {
      toast.error("Ошибка", e?.message);
    }
  }

  async function removeItem(item: ContactSubmission) {
    if (!token) return;
    if (!confirm(`Удалить сообщение от ${item.name}?`)) return;
    try {
      await deleteContactSubmission(token, item.id);
      setItems((prev) => prev.filter((p) => p.id !== item.id));
      if (active?.id === item.id) setActive(null);
      if (!item.is_read) setUnreadCount((c) => Math.max(0, c - 1));
      toast.success("Удалено");
    } catch (e: any) {
      toast.error("Не удалось удалить", e?.message);
    }
  }

  return (
    <main className="central-shell">
      <header className="central-header">
        <div>
          <p className="central-header__eyebrow">Super Admin / Contact Inbox</p>
          <h1 className="central-header__title">
            Обращения с сайта {unreadCount > 0 && <span style={{
              display: "inline-block", marginLeft: 8, background: "#e5234d", color: "#fff",
              borderRadius: 999, padding: "2px 10px", fontSize: 14, verticalAlign: "middle"
            }}>{unreadCount}</span>}
          </h1>
          <p style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
            Все заявки с формы обратной связи — в одном ящике. Если ответить в течение часа — конверсия выше.
          </p>
        </div>
        <div className="central-header__actions">
          <Link href="/central/dashboard" className="central-btn central-btn--ghost">
            <ArrowLeft size={14} /> К магазинам
          </Link>
          <button onClick={refresh} disabled={loading} className="central-btn central-btn--ghost">
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Обновить
          </button>
          <button
            onClick={() => { clear(); toast.info("Сессия завершена"); router.push("/central/login"); }}
            className="central-btn central-btn--ghost"
          >
            <LogOut size={14} /> Выйти
          </button>
        </div>
      </header>

      <section style={{ padding: "0 24px 24px", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>
        {/* List pane */}
        <div className="central-stat" style={{ padding: 0, overflow: "hidden", minHeight: 500 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #2a2a2a", display: "flex", gap: 8 }}>
            <button
              onClick={() => setFilter("all")}
              className={`central-btn ${filter === "all" ? "central-btn--primary" : "central-btn--ghost"}`}
              style={{ fontSize: 12 }}
            >
              Все
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`central-btn ${filter === "unread" ? "central-btn--primary" : "central-btn--ghost"}`}
              style={{ fontSize: 12 }}
            >
              Непрочитанные ({unreadCount})
            </button>
          </div>
          {loading ? (
            <p style={{ color: "#888", padding: 24 }}>Загрузка…</p>
          ) : items.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#888" }}>
              <Inbox size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
              <p>Пока пусто. Когда клиенты оставят заявку через форму — она появится здесь.</p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "70vh", overflowY: "auto" }}>
              {items.map((it) => (
                <li
                  key={it.id}
                  onClick={() => openMessage(it)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #1f1f1f",
                    cursor: "pointer",
                    background: active?.id === it.id ? "#1a1a1a" : (it.is_read ? "transparent" : "rgba(229, 35, 77, 0.06)"),
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start"
                  }}
                >
                  {!it.is_read && <span style={{ width: 8, height: 8, borderRadius: 999, background: "#e5234d", marginTop: 6, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: it.is_read ? 500 : 700, color: it.is_read ? "#aaa" : "#fff", fontSize: 13 }}>
                      {it.name}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {it.subject ? it.subject + " — " : ""}{it.message.slice(0, 80)}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#666" }}>
                      {new Date(it.created_at).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail pane */}
        <div className="central-stat" style={{ padding: 24, minHeight: 500, alignContent: "start" }}>
          {!active ? (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#666", textAlign: "center" }}>
              <div>
                <Mail size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>Выберите сообщение слева, чтобы прочитать</p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{active.subject || "(без темы)"}</h3>
                  <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>
                    От <strong style={{ color: "#ddd" }}>{active.name}</strong> ·{" "}
                    <a href={`mailto:${active.email}`} style={{ color: "#5ac8fa" }}>{active.email}</a>
                    {active.phone && <> · <a href={`tel:${active.phone}`} style={{ color: "#5ac8fa" }}>{active.phone}</a></>}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => markUnread(active)} className="central-btn central-btn--ghost" title="Пометить непрочитанным">
                    <MailOpen size={14} />
                  </button>
                  <button onClick={() => removeItem(active)} className="central-btn central-btn--ghost" title="Удалить" style={{ color: "#ff8b8b" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{
                padding: 16,
                background: "#0a0a0a",
                border: "1px solid #2a2a2a",
                borderRadius: 8,
                color: "#ddd",
                lineHeight: 1.6,
                fontSize: 14,
                whiteSpace: "pre-wrap",
                minHeight: 200
              }}>
                {active.message}
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 11, color: "#666" }}>
                Получено: {new Date(active.created_at).toLocaleString("ru-RU")}
                {active.source_url && <> · с страницы <code>{active.source_url}</code></>}
                {active.user_ip && <> · IP: {active.user_ip}</>}
              </p>
              <a
                href={`mailto:${active.email}?subject=Re: ${encodeURIComponent(active.subject || "Заявка с Sun Store")}`}
                className="central-btn central-btn--primary"
                style={{ marginTop: 16, display: "inline-flex" }}
              >
                <Check size={14} /> Ответить по email
              </a>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
