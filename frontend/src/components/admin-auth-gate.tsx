"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sunstore-admin-session";

export interface AdminSession {
  token: string;
  username: string;
  expiresAt: string;
}

export function readAdminSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminSession;
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
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    setSession(readAdminSession());
  }, []);

  if (!session) {
    return (
      <div className="admin-empty">
        <p className="eyebrow">Admin access required</p>
        <h2>Войдите в панель управления</h2>
        <p>Если backend ещё не поднят, форма логина использует безопасный mock fallback.</p>
        <Link href={"/admin/login" as Route} className="button button--primary">
          Открыть вход
        </Link>
      </div>
    );
  }

  return <>{children(session)}</>;
}
