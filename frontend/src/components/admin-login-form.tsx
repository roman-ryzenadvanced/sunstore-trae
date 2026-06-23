"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

import { writeAdminSession } from "@/components/admin-auth-gate";
import { adminLogin } from "@/lib/api";
import { toast } from "@/components/toaster";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!username.trim()) return "Введите логин";
    if (username.trim().length < 3) return "Логин минимум 3 символа";
    if (!password) return "Введите пароль";
    if (password.length < 4) return "Пароль минимум 4 символа";
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await adminLogin(username.trim(), password);
      writeAdminSession({
        token: response.token,
        username: response.username,
        expiresAt: response.expires_at
      });
      toast.success(`Добро пожаловать, ${response.username}`);
      router.push("/admin/products" as Route);
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Не удалось войти";
      setError(message);
      toast.error("Ошибка входа", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-login-card" onSubmit={handleSubmit} noValidate>
      <div>
        <p className="eyebrow">Sun Panels Store back office</p>
        <h1>Вход в админ-панель</h1>
        <p className="muted">
          Используйте учётные данные API. При недоступном backend включится
          демо-режим.
        </p>
      </div>

      <label className="field">
        <span>Логин</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          minLength={3}
          aria-describedby={error ? "login-error" : undefined}
        />
      </label>

      <label className="field">
        <span>Пароль</span>
        <div className="field__with-suffix">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            minLength={4}
            aria-describedby={error ? "login-error" : undefined}
          />
          <button
            type="button"
            className="field__suffix"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </label>

      {error ? (
        <p className="error-text" id="login-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="button button--primary"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="spin" aria-hidden="true" /> Входим…
          </>
        ) : (
          <>
            <LogIn size={16} aria-hidden="true" /> Войти
          </>
        )}
      </button>
    </form>
  );
}
