"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, RefreshCw, Trash2, Users } from "lucide-react";

import {
  listAllSubscribers,
  listCentralSites,
  Subscriber,
  CentralSite,
  broadcast,
} from "@/lib/multi-site/api";
import { useCentralAuthStore } from "@/lib/multi-site/store";
import { toast } from "@/components/toaster";

import "../central.css";

export default function CentralSubscribersPage() {
  const router = useRouter();
  const token = useCentralAuthStore((s) => s.token);
  const clear = useCentralAuthStore((s) => s.clear);

  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [sites, setSites] = useState<CentralSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState<number | "">("");

  // Broadcast form
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [bcSubject, setBcSubject] = useState("");
  const [bcBody, setBcBody] = useState("");
  const [bcBusy, setBcBusy] = useState(false);

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
        listAllSubscribers(token, {
          search: search.trim() || undefined,
          site_id: siteFilter === "" ? undefined : Number(siteFilter),
        }),
        listCentralSites(token),
      ]);
      setSubs(list);
      setSites(siteList);
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    return {
      total: subs.length,
      active: subs.filter((s) => s.status === "SUBSCRIBED").length,
      unsubscribed: subs.filter((s) => s.status === "UNSUBSCRIBED").length,
    };
  }, [subs]);

  function siteName(id: number) {
    return sites.find((s) => s.id === id)?.name || `#${id}`;
  }

  async function sendBroadcast() {
    if (!token) return;
    if (!bcSubject.trim() || !bcBody.trim()) {
      toast.error("Заполните тему и текст");
      return;
    }
    setBcBusy(true);
    try {
      const r = await broadcast(token, {
        site_id: siteFilter === "" ? undefined : Number(siteFilter),
        subject: bcSubject,
        html_body: bcBody,
      });
      toast.success("Рассылка отправлена", `Отправлено: ${r.sent}, ошибок: ${r.failed}`);
      setShowBroadcast(false);
      setBcSubject("");
      setBcBody("");
    } catch (e: any) {
      toast.error("Ошибка рассылки", e?.message);
    } finally {
      setBcBusy(false);
    }
  }

  return (
    <main className="central-shell">
      <header className="central-header">
        <div>
          <p className="central-header__eyebrow">Sun Panels Store Super Admin</p>
          <h1 className="central-header__title">База подписчиков (Mailing List)</h1>
          <p style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
            Все подписчики из всех магазинов + массовая рассылка.
          </p>
        </div>
        <div className="central-header__actions">
          <button onClick={() => setShowBroadcast((v) => !v)} className="central-btn central-btn--primary">
            <Users size={14} /> Рассылка
          </button>
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
          { label: "Активных", v: counts.active },
          { label: "Отписанных", v: counts.unsubscribed },
        ].map((c) => (
          <div key={c.label} className="central-stat">
            <p className="central-stat__label">{c.label}</p>
            <p className="central-stat__value">{c.v}</p>
          </div>
        ))}
      </section>

      <section style={{ padding: "0 24px 24px" }}>
        {showBroadcast && (
          <div className="central-stat" style={{ padding: 20, marginBottom: 16, border: "1px solid #00ff88" }}>
            <p className="central-stat__label">
              Массовая рассылка {siteFilter !== "" ? `→ ${siteName(Number(siteFilter))}` : "→ Все магазины"}
            </p>
            <input
              value={bcSubject}
              onChange={(e) => setBcSubject(e.target.value)}
              className="central-setup__field-input"
              style={{ margin: "8px 0" }}
              placeholder="Тема письма"
            />
            <textarea
              value={bcBody}
              onChange={(e) => setBcBody(e.target.value)}
              className="central-setup__field-input"
              style={{ width: "100%", minHeight: 120, fontFamily: "inherit" }}
              placeholder="Текст письма (HTML)…"
            />
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button onClick={sendBroadcast} disabled={bcBusy} className="central-btn central-btn--primary">
                {bcBusy ? "Отправка…" : "Отправить всем"}
              </button>
              <button onClick={() => setShowBroadcast(false)} className="central-btn central-btn--ghost">Отмена</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") refresh(); }}
            placeholder="Поиск по email…"
            className="central-search"
            style={{ flex: "1 1 200px", marginBottom: 0 }}
          />
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
        ) : subs.length === 0 ? (
          <div className="central-empty">
            <Users size={32} style={{ opacity: 0.4 }} />
            <p className="central-empty__text">Подписчиков пока нет.</p>
          </div>
        ) : (
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ background: "#1a1a1a", color: "#888", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                  <th style={{ padding: 12, textAlign: "left" }}>Email</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Магазин</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Статус</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Дата</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={`${s.site_id}-${s.id}`} style={{ borderTop: "1px solid #1a1a1a" }}>
                    <td style={{ padding: 12, fontSize: 13 }}>{s.email}</td>
                    <td style={{ padding: 12, fontSize: 12 }}>
                      <Link href={`/central/sites/${s.site_id}`} style={{ color: "#00ff88" }}>
                        {siteName(s.site_id)}
                      </Link>
                    </td>
                    <td style={{ padding: 12, fontSize: 12 }}>
                      <span className={`central-status-pill central-status-pill--${String(s.status).toLowerCase()}`}>{s.status}</span>
                    </td>
                    <td style={{ padding: 12, fontSize: 12, color: "#aaa" }}>
                      {new Date(s.created_at).toLocaleString("ru-RU")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
