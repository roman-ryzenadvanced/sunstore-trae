"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TEMPLATES } from "@/lib/templates/templates";
import { createCentralSite, persistMockSite } from "@/lib/multi-site/api";
import { useCentralAuthStore } from "@/lib/multi-site/store";
import type { CentralSite } from "@/lib/multi-site/api";

export default function CentralSetupPage() {
  const router = useRouter();
  const token = useCentralAuthStore((s) => s.token);
  const [step, setStep] = useState<"niche" | "details" | "owner" | "review">("niche");
  const [templateId, setTemplateId] = useState<string>("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [ownerUsername, setOwnerUsername] = useState("owner");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const template = useMemo(() => TEMPLATES.find((t) => t.id === templateId), [templateId]);
  const filtered = useMemo(() => {
    if (!query) return TEMPLATES;
    const q = query.toLowerCase();
    return TEMPLATES.filter(
      (t) => t.name.toLowerCase().includes(q) || t.niche.toLowerCase().includes(q) || t.id.includes(q)
    );
  }, [query]);

  function slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function next() {
    if (step === "niche") {
      if (!templateId) return setErr("Выберите шаблон");
      setErr(null);
      setStep("details");
    } else if (step === "details") {
      if (!name) return setErr("Введите название магазина");
      if (!slug) return setErr("Введите slug");
      setErr(null);
      setStep("owner");
    } else if (step === "owner") {
      if (!ownerUsername || ownerUsername.length < 3) return setErr("Логин владельца ≥ 3 символов");
      if (!ownerEmail) return setErr("Email обязателен");
      if (ownerPassword.length < 8) return setErr("Пароль ≥ 8 символов");
      setErr(null);
      setStep("review");
    }
  }

  function back() {
    if (step === "details") setStep("niche");
    else if (step === "owner") setStep("details");
    else if (step === "review") setStep("owner");
  }

  async function provision() {
    if (!template) return;
    setBusy(true);
    setErr(null);
    const input = {
      slug,
      name,
      niche: template.niche,
      template_id: template.id,
      owner_email: ownerEmail,
      owner_username: ownerUsername,
      owner_password: ownerPassword,
      primary_color: primaryColor || template.colors.accent,
      logo_mark: template.branding.logoMark,
      tagline: tagline || template.branding.tagline,
      description: template.branding.description,
    };
    try {
      if (!token) {
        // Mock path: create a local-only site so the UI is usable.
        const mock: CentralSite = {
          id: Date.now(),
          slug,
          name,
          niche: template.niche,
          template_id: template.id,
          status: "READY",
          primary_color: input.primary_color,
          logo_mark: input.logo_mark,
          tagline: input.tagline,
          description: input.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        persistMockSite(mock);
        router.push(`/central/dashboard?created=${slug}`);
        return;
      }
      await createCentralSite(token, input);
      window.location.href = "/central/dashboard?created=" + slug;
    } catch (e: any) {
      setErr(e?.message || "Ошибка создания");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", borderBottom: "1px solid #222" }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#888", margin: 0 }}>Sun.store / Setup</p>
          <h1 style={{ fontSize: 22, margin: "4px 0 0", fontWeight: 600 }}>Создание магазина</h1>
        </div>
        <Link href="/central/dashboard" style={{ padding: "8px 12px", borderRadius: 6, background: "transparent", border: "1px solid #333", color: "#888", textDecoration: "none", fontSize: 12 }}>
          ← Назад
        </Link>
      </header>

      <section style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
        <Steps step={step} />
        {err && <p style={{ color: "#FF5252", fontSize: 13, margin: "16px 0" }}>{err}</p>}

        {step === "niche" && (
          <>
            <p style={{ color: "#aaa", fontSize: 14, marginBottom: 16 }}>Шаг 1 — выберите шаблон ниши. Любую тему можно потом кастомизировать.</p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск: ювелирка, спорт, книги…"
              style={{ width: "100%", padding: 12, borderRadius: 8, background: "#111", border: "1px solid #222", color: "#fff", marginBottom: 16 }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {filtered.map((t) => {
                const selected = templateId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    style={{
                      textAlign: "left",
                      padding: 16,
                      borderRadius: 12,
                      background: selected ? t.colors.accent : t.colors.background,
                      color: selected ? t.colors.accentText : t.colors.text,
                      border: `1px solid ${selected ? t.colors.accent : t.colors.border}`,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{t.branding.logoMark}</div>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 0" }}>{t.niche}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === "details" && template && (
          <>
            <p style={{ color: "#aaa", fontSize: 14, marginBottom: 16 }}>Шаг 2 — базовые данные магазина.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Название магазина" value={name} onChange={(v) => { setName(v); if (!slug) setSlug(slugify(v)); }} />
              <Field label="Slug (URL)" value={slug} onChange={setSlug} hint="латиница, без пробелов" />
              <Field label="Слоган (опц.)" value={tagline} onChange={setTagline} placeholder={template.branding.tagline} />
              <Field label="Главный цвет (HEX, опц.)" value={primaryColor} onChange={setPrimaryColor} placeholder={template.colors.accent} />
            </div>
          </>
        )}

        {step === "owner" && (
          <>
            <p style={{ color: "#aaa", fontSize: 14, marginBottom: 16 }}>Шаг 3 — данные первого владельца магазина.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Логин владельца" value={ownerUsername} onChange={setOwnerUsername} />
              <Field label="Email" value={ownerEmail} onChange={setOwnerEmail} type="email" />
              <Field label="Пароль (≥ 8 символов)" value={ownerPassword} onChange={setOwnerPassword} type="password" />
            </div>
          </>
        )}

        {step === "review" && template && (
          <>
            <p style={{ color: "#aaa", fontSize: 14, marginBottom: 16 }}>Шаг 4 — проверка и запуск.</p>
            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 24, marginBottom: 16 }}>
              <p style={{ margin: 0, color: "#888", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Шаблон</p>
              <p style={{ margin: "4px 0 16px", fontSize: 18 }}>{template.name} ({template.niche})</p>
              <p style={{ margin: 0, color: "#888", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Магазин</p>
              <p style={{ margin: "4px 0 16px", fontSize: 18 }}>{name} — /{slug}</p>
              <p style={{ margin: 0, color: "#888", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Владелец</p>
              <p style={{ margin: "4px 0", fontSize: 18 }}>{ownerUsername} ({ownerEmail})</p>
            </div>
          </>
        )}

        <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
          {step !== "niche" && (
            <button onClick={back} style={{ padding: "10px 16px", borderRadius: 8, background: "transparent", border: "1px solid #333", color: "#aaa", cursor: "pointer" }}>
              ← Назад
            </button>
          )}
          {step !== "review" ? (
            <button onClick={next} style={{ padding: "10px 16px", borderRadius: 8, background: "#00FF88", color: "#000", border: "none", fontWeight: 600, cursor: "pointer" }}>
              Далее →
            </button>
          ) : (
            <button
              onClick={provision}
              disabled={busy}
              style={{ padding: "10px 16px", borderRadius: 8, background: busy ? "#444" : "#00FF88", color: "#000", border: "none", fontWeight: 600, cursor: busy ? "default" : "pointer" }}
            >
              {busy ? "Создаём…" : "🚀 Запустить магазин"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, hint, type }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; type?: string }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: 12, color: "#aaa" }}>{label}</span>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #333", background: "#000", color: "#fff", marginTop: 4 }}
      />
      {hint && <span style={{ fontSize: 11, color: "#666" }}>{hint}</span>}
    </label>
  );
}

function Steps({ step }: { step: "niche" | "details" | "owner" | "review" }) {
  const order: Array<typeof step> = ["niche", "details", "owner", "review"];
  const labels = ["Ниша", "Данные", "Владелец", "Запуск"];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {order.map((s, i) => {
        const active = s === step;
        const done = order.indexOf(step) > i;
        return (
          <div key={s} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 2, background: active || done ? "#00FF88" : "#222" }} />
            <p style={{ fontSize: 11, color: active ? "#fff" : "#888", margin: "6px 0 0", letterSpacing: 1, textTransform: "uppercase" }}>{labels[i]}</p>
          </div>
        );
      })}
    </div>
  );
}
