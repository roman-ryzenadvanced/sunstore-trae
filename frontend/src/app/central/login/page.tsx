"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

import { centralLogin } from "@/lib/multi-site/api";
import { useCentralAuthStore } from "@/lib/multi-site/store";
import { toast } from "@/components/toaster";

import "../central.css";

export default function CentralLoginPage() {
  const router = useRouter();
  const setSession = useCentralAuthStore((s) => s.setSession);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErr("Введите логин и пароль");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await centralLogin(username, password);
      setSession(r.token, r.username);
      toast.success(`Добро пожаловать, ${r.username}`);
      router.push("/central/dashboard");
    } catch (e: any) {
      const msg = e?.message || "Ошибка входа";
      setErr(msg);
      toast.error("Ошибка входа", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="central-login-wrap">
      <form onSubmit={submit} className="central-login">
        <p className="central-header__eyebrow">Sun.store / Platform</p>
        <h1 style={{ fontSize: 26, fontWeight: 600, margin: "8px 0 24px" }}>
          Центральный вход
        </h1>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#aaa" }}>Логин</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="central-setup__field-input"
          />
        </label>
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#aaa" }}>Пароль</span>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="central-setup__field-input"
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: 0,
                color: "#888",
                cursor: "pointer",
                padding: 4
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        {err && (
          <p style={{ color: "#FF5252", fontSize: 12, marginBottom: 12 }}>
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="central-btn central-btn--primary"
          style={{ width: "100%" }}
        >
          {busy ? (
            <>
              <Loader2 size={14} className="spin" /> Входим…
            </>
          ) : (
            <>
              <LogIn size={14} /> Войти в платформу
            </>
          )}
        </button>
        <p style={{ marginTop: 16, fontSize: 11, color: "#666", textAlign: "center" }}>
          Учетные данные выдаются администратором платформы.
        </p>
      </form>
    </main>
  );
}
