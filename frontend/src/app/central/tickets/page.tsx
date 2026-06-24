"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, MessageSquare, RefreshCw, Send } from "lucide-react";

import {
  listAllTickets,
  listCentralSites,
  SupportTicket,
  CentralSite,
} from "@/lib/multi-site/api";
import { useCentralAuthStore } from "@/lib/multi-site/store";
import { toast } from "@/components/toaster";

import "../central.css";

const STATUS_FILTERS = [
  { value: "", label: "Все" },
  { value: "NEW", label: "Новые" },
  { value: "OPEN", label: "Открытые" },
  { value: "REPLIED", label: "Отвеченные" },
  { value: "CLOSED", label: "Закрытые" },
];

export default function CentralTicketsPage() {
  const router = useRouter();
  const token = useCentralAuthStore((s) => s.token);
  const clear = useCentralAuthStore((s) => s.clear);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [sites, setSites] = useState<CentralSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState<number | "">("");

  useEffect(() => {
    if (token === null) {
      router.push("/central/login");
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function refresh() {
    if (!token) return;
    setLoading(true);
    try {
      const [list, siteList] = await Promise.all([
        listAllTickets(token, {
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          site_id: siteFilter === "" ? undefined : Number(siteFilter),
        }),
        listCentralSites(token),
      ]);
      setTickets(list);
      setSites(siteList);
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    return {
      total: tickets.length,
      new: tickets.filter((t) => t.status === "NEW").length,
      open: tickets.filter((t) => t.status === "OPEN").length,
      replied: tickets.filter((t) => t.status === "REPLIED").length,
    };
  }, [tickets]);

  function siteName(id: number) {
    return sites.find((s) => s.id === id)?.name || `#${id}`;
  }

  return (
    <main className="central-shell">
      <header className="central-header">
        <div>
          <p className="central-header__eyebrow">Sun Panels Store Super Admin</p>
          <h1 className="central-header__title">Все обращения (Inbox)</h1>
          <p style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
            Единый inbox для всех форм контактов со всех магазинов.
          </p>
        </div>
        <div className="central-header__actions">
          <button onClick={refresh} disabled={loading} className="central-btn central-btn--ghost">
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Обновить
          </button>
          <Link href="/central/dashboard" className="central-btn central-btn--ghost">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <button
            onClick={() => { clear(); router.push("/central/login"); }}
            className="central-btn central-btn--ghost"
          >
            <LogOut size={14} /> Выйти
          </button>
        </div>
      </header>

      <section className="central-stats">
        {[
          { label: "Всего", v: counts.total },
          { label: "Новые", v: counts.new },
          { label: "Открытые", v: counts.open },
          { label: "Отвеченные", v: counts.replied },
        ].map((c) => (
          <div key={c.label} className="central-stat">
            <p className="central-stat__label">{c.label}</p>
            <p className="central-stat__value">{c.v}</p>
          </div>
        ))}
      </section>

      <section style={{ padding: "0 24px 24px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") refresh(); }}
            placeholder="Поиск по имени, email, теме…"
            className="central-search"
            style={{ flex: "1 1 200px", marginBottom: 0 }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="central-search"
            style={{ marginBottom: 0, width: "auto" }}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value === "" ? "" : Number(e.target.value))}
            className="central-search"
            style={{ marginBottom: 0, width: "auto" }}
          >
            <option value="">Все магазины</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p style={{ color: "#888", padding: 24 }}>Загрузка…</p>
        ) : tickets.length === 0 ? (
          <div className="central-empty">
            <MessageSquare size={32} style={{ opacity: 0.4 }} />
            <p className="central-empty__text">Обращений пока нет.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {tickets.map((t) => (
              <div key={t.id} className="central-stat" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                      {t.subject}
                      <span className={`central-status-pill central-status-pill--${String(t.status).toLowerCase()}`} style={{ marginLeft: 8, fontSize: 10 }}>
                        {t.status}
                      </span>
                    </p>
                    <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>
                      <Link href={`/central/sites/${t.site_id}`} style={{ color: "#00ff88" }}>{siteName(t.site_id)}</Link>
                      {" · "}
                      {t.name} &lt;{t.email}&gt; {t.phone && `· ${t.phone}`}
                      {" · "}
                      {new Date(t.created_at).toLocaleString("ru-RU")}
                    </p>
                    <p style={{ marginTop: 8, fontSize: 13, color: "#ccc", whiteSpace: "pre-wrap", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                      {t.message}
                    </p>
                    {t.reply_body && (
                      <div style={{ marginTop: 8, padding: 8, background: "#0a0a0a", borderRadius: 6, fontSize: 12, color: "#aaa" }}>
                        <p style={{ fontWeight: 700, margin: 0 }}>↳ {t.reply_subject}</p>
                        <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{t.reply_body}</p>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/central/sites/${t.site_id}`}
                    className="central-btn central-btn--ghost"
                    style={{ fontSize: 11, padding: "4px 8px", whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    <Send size={11} /> Ответить
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
