"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { centralLogin } from "@/lib/multi-site/api";
import { useCentralAuthStore } from "@/lib/multi-site/store";

export default function CentralLoginPage() {
  const router = useRouter();
  const setSession = useCentralAuthStore((s) => s.setSession);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("changeme123");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await centralLogin(username, password);
      setSession(r.token, r.username);
      router.push("/central/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Ошибка входа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0A0A0A", color: "#fff", fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <form
        onSubmit={submit}
        style={{
          width: 360,
          padding: 32,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#888", margin: 0 }}>Sun.store / Platform</p>
        <h1 style={{ fontSize: 26, fontWeight: 600, margin: "8px 0 24px" }}>Центральный вход</h1>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#aaa" }}>Логин</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #333", background: "#000", color: "#fff", marginTop: 4 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#aaa" }}>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #333", background: "#000", color: "#fff", marginTop: 4 }}
          />
        </label>
        {err && <p style={{ color: "#FF5252", fontSize: 12, marginBottom: 12 }}>{err}</p>}
        <button
          type="submit"
          disabled={busy}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: busy ? "#444" : "#00FF88",
            color: "#000",
            fontWeight: 700,
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy ? "Входим…" : "Войти в платформу"}
        </button>
        <p style={{ marginTop: 16, fontSize: 11, color: "#666" }}>
          По умолчанию: <code>admin</code> / <code>changeme123</code>
        </p>
      </form>
    </main>
  );
}
