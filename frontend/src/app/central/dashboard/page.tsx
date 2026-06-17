"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listCentralSites, setSiteStatus, CreateSiteInput, CentralSite } from "@/lib/multi-site/api";
import { useCentralAuthStore } from "@/lib/multi-site/store";
import { TEMPLATES } from "@/lib/templates/templates";

export default function CentralDashboardPage() {
  const router = useRouter();
  const token = useCentralAuthStore((s) => s.token);
  const clear = useCentralAuthStore((s) => s.clear);
  const [sites, setSites] = useState<CentralSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

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
      const list = await listCentralSites(token, { search: filter || undefined });
      setSites(list);
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    return {
      total: sites.length,
      ready: sites.filter((s) => s.status === "READY").length,
      suspended: sites.filter((s) => s.status === "SUSPENDED").length,
      provisioning: sites.filter((s) => s.status === "PROVISIONING").length,
    };
  }, [sites]);

  async function toggleStatus(s: CentralSite) {
    if (!token) return;
    const next = s.status === "READY" ? "SUSPENDED" : "READY";
    try {
      await setSiteStatus(token, s.id, next);
      await refresh();
    } catch (e) {
      // best effort
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", borderBottom: "1px solid #222" }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#888", margin: 0 }}>Sun.store Platform</p>
          <h1 style={{ fontSize: 22, margin: "4px 0 0", fontWeight: 600 }}>Центральная панель</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/central/setup"
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#00FF88",
              color: "#000",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            + Создать магазин
          </Link>
          <button
            onClick={() => { clear(); router.push("/central/login"); }}
            style={{ padding: "10px 16px", borderRadius: 8, background: "transparent", color: "#aaa", border: "1px solid #333", cursor: "pointer" }}
          >
            Выйти
          </button>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: 24 }}>
        {[
          { label: "Всего сайтов", v: counts.total },
          { label: "Активных", v: counts.ready },
          { label: "Provisioning", v: counts.provisioning },
          { label: "Suspended", v: counts.suspended },
        ].map((c) => (
          <div key={c.label} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>{c.label}</p>
            <p style={{ fontSize: 32, fontWeight: 700, margin: "8px 0 0" }}>{c.v}</p>
          </div>
        ))}
      </section>

      <section style={{ padding: "0 24px 24px" }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") refresh(); }}
          placeholder="Поиск по имени или slug…"
          style={{ width: "100%", padding: 12, borderRadius: 8, background: "#111", border: "1px solid #222", color: "#fff", marginBottom: 16 }}
        />

        {loading ? (
          <p style={{ color: "#888" }}>Загрузка…</p>
        ) : sites.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", background: "#111", borderRadius: 12, border: "1px solid #222" }}>
            <p style={{ color: "#aaa" }}>Пока нет магазинов.</p>
            <Link
              href="/central/setup"
              style={{ display: "inline-block", marginTop: 12, padding: "10px 16px", borderRadius: 8, background: "#00FF88", color: "#000", fontWeight: 600, textDecoration: "none" }}
            >
              Создать первый магазин
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {sites.map((s) => {
              const template = TEMPLATES.find((t) => t.id === s.template_id);
              return (
                <article key={s.id} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{s.name}</p>
                      <p style={{ color: "#888", fontSize: 12, margin: "4px 0 0" }}>slug: {s.slug} · niche: {s.niche}</p>
                    </div>
                    <span style={{
                      fontSize: 10,
                      padding: "4px 8px",
                      borderRadius: 99,
                      background: s.status === "READY" ? "rgba(0,255,136,0.15)" : "rgba(255,180,0,0.15)",
                      color: s.status === "READY" ? "#00FF88" : "#FFB400",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}>{s.status}</span>
                  </div>
                  <p style={{ color: "#aaa", fontSize: 13, margin: "12px 0" }}>{s.tagline || template?.branding.tagline || "—"}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {template?.categories.map((c) => (
                      <span key={c.id} style={{ fontSize: 11, padding: "2px 8px", background: "#1f1f1f", border: "1px solid #2a2a2a", borderRadius: 99, color: "#bbb" }}>{c.name}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link
                      href={`/sites/${s.slug}`}
                      target="_blank"
                      style={{ padding: "8px 12px", borderRadius: 6, background: "transparent", border: "1px solid #00FF88", color: "#00FF88", textDecoration: "none", fontSize: 12 }}
                    >
                      Открыть витрину
                    </Link>
                    <Link
                      href={`/sites/${s.slug}/admin`}
                      style={{ padding: "8px 12px", borderRadius: 6, background: "transparent", border: "1px solid #FFB400", color: "#FFB400", textDecoration: "none", fontSize: 12 }}
                    >
                      Админ панель
                    </Link>
                    <Link
                      href={`/central/sites/${s.id}/admins`}
                      style={{ padding: "8px 12px", borderRadius: 6, background: "transparent", border: "1px solid #888", color: "#888", textDecoration: "none", fontSize: 12 }}
                    >
                      Команда
                    </Link>
                    <button
                      onClick={() => toggleStatus(s)}
                      style={{ padding: "8px 12px", borderRadius: 6, background: "transparent", border: "1px solid #888", color: "#888", cursor: "pointer", fontSize: 12 }}
                    >
                      {s.status === "READY" ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
