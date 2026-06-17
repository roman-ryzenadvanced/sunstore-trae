"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

import { writeAdminSession } from "@/components/admin-auth-gate";
import { adminLogin } from "@/lib/api";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("atelier");
  const [password, setPassword] = useState("sunstore");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await adminLogin(username, password);
      writeAdminSession({
        token: response.token,
        username: response.username,
        expiresAt: response.expires_at
      });
      router.push("/admin/products" as Route);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Не удалось войти"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-login-card" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Sun.store back office</p>
        <h1>Вход в админ-панель</h1>
        <p className="muted">
          Используйте реальные учётные данные API. При недоступном backend включится
          demo fallback.
        </p>
      </div>

      <label className="field">
        <span>Логин</span>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>

      <label className="field">
        <span>Пароль</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error ? <p className="error-text">{error}</p> : null}

      <button type="submit" className="button button--primary" disabled={loading}>
        {loading ? "Входим..." : "Войти"}
      </button>
    </form>
  );
}
