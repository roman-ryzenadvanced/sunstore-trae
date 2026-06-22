"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sunstore-admin-session";

export interface AdminSession {
  token: string;
  username: string;
  expiresAt: string;
}

export function readAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AdminSession;
    if (!session.token || !session.expiresAt) return null;

    // Expiry check — auto-clear if expired.
    const expiresAt = new Date(session.expiresAt).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function writeAdminSession(session: AdminSession) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}

export function clearAdminSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function AdminAuthGate({
  children
}: {
  children: (session: AdminSession) => React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readAdminSession());
    setReady(true);

    // Watch for storage events (logout in another tab).
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setSession(readAdminSession());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Periodic expiry check while tab is focused.
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const fresh = readAdminSession();
      if (!fresh) {
        setSession(null);
        router.replace("/admin/login" as Route);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [session, router]);

  if (!ready) {
    return (
      <div className="admin-empty" role="status" aria-live="polite">
        <p>Проверка сессии…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="admin-empty">
        <p className="eyebrow">Нужен вход в админ-панель</p>
        <h2>Войдите, чтобы продолжить</h2>
        <p>
          Если backend недоступен, форма логина переключится на безопасный
          демо-режим — изменения сохранятся только локально.
        </p>
        <Link href={"/admin/login" as Route} className="button button--primary">
          Открыть вход
        </Link>
      </div>
    );
  }

  return <>{children(session)}</>;
}
