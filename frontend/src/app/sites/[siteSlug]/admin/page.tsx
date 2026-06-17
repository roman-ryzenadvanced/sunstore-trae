"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { siteAdminLogin } from "@/lib/multi-site/api";
import { useSiteSessionStore } from "@/lib/multi-site/store";

export default function SiteAdminLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params?.siteSlug || "");
  const setSession = useSiteSessionStore((s) => s.setSession);
  const [username, setUsername] = useState("owner");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await siteAdminLogin(slug, username, password);
      setSession(slug, r.token, username);
      router.push(`/sites/${slug}/admin/dashboard`);
    } catch (e: any) {
      setErr(e?.message || "Ошибка входа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0A0A0A", color: "#fff", fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <form onSubmit={submit} style={{ width: 360, padding: 32, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#888", margin: 0 }}>Site Admin</p>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "8px 0 4px" }}>Вход в магазин</h1>
        <p style={{ color: "#888", fontSize: 12, margin: "0 0 24px" }}>slug: {slug}</p>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#aaa" }}>Логин</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #333", background: "#000", color: "#fff", marginTop: 4 }} />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#aaa" }}>Пароль</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #333", background: "#000", color: "#fff", marginTop: 4 }} />
        </label>
        {err && <p style={{ color: "#FF5252", fontSize: 12, marginBottom: 12 }}>{err}</p>}
        <button type="submit" disabled={busy} style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: busy ? "#444" : "#00FF88", color: "#000", fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
          {busy ? "Входим…" : "Войти"}
        </button>
        <Link href={`/sites/${slug}`} style={{ display: "block", textAlign: "center", marginTop: 16, color: "#888", fontSize: 12, textDecoration: "none" }}>
          ← К витрине магазина
        </Link>
      </form>
    </main>
  );
}
