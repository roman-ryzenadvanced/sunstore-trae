"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Users } from "lucide-react";

import {
  addSiteAdmin,
  listCentralSites,
  listSiteAdmins,
  removeSiteAdmin
} from "@/lib/multi-site/api";
import { useCentralAuthStore } from "@/lib/multi-site/store";
import type { CentralSiteAdmin, CentralSite } from "@/lib/multi-site/api";
import { toast } from "@/components/toaster";

import "../../../central.css";

export default function SiteAdminsPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const token = useCentralAuthStore((s) => s.token);

  const [site, setSite] = useState<CentralSite | null>(null);
  const [admins, setAdmins] = useState<CentralSiteAdmin[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token === null) {
      router.push("/central/login");
      return;
    }
    if (!id) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  async function refresh() {
    if (!token || !id) return;
    setLoading(true);
    try {
      const list = await listCentralSites(token);
      setSite(list.find((s) => s.id === id) || null);
      const a = await listSiteAdmins(token, id);
      setAdmins(a);
    } catch (e: any) {
      const msg = e?.message || "load failed";
      setErr(msg);
      toast.error("Ошибка загрузки", msg);
    } finally {
      setLoading(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    if (username.trim().length < 3) {
      setErr("Логин минимум 3 символа");
      return;
    }
    if (password.length < 8) {
      setErr("Пароль минимум 8 символов");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await addSiteAdmin(token, id, username.trim(), password, role);
      toast.success("Администратор добавлен", username);
      setUsername("");
      setPassword("");
      setRole("manager");
      await refresh();
    } catch (e: any) {
      const msg = e?.message || "create failed";
      setErr(msg);
      toast.error("Ошибка", msg);
    } finally {
      setBusy(false);
    }
  }

  async function remove(adminId: number, name: string) {
    if (!token || !id) return;
    if (!confirm(`Удалить администратора «${name}»?`)) return;
    try {
      await removeSiteAdmin(token, id, adminId);
      toast.success("Администратор удалён", name);
      await refresh();
    } catch (e: any) {
      toast.error("Ошибка", e?.message || "remove failed");
    }
  }

  return (
    <main className="central-shell" style={{ padding: 32 }}>
      <Link
        href="/central/dashboard"
        className="central-btn central-btn--ghost"
        style={{ display: "inline-flex", marginBottom: 12 }}
      >
        ← К списку сайтов
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: "12px 0 4px" }}>
        Команда сайта: {site?.name || (loading ? "..." : "не найден")}
      </h1>
      <p style={{ color: "#888", fontSize: 13, margin: 0 }}>
        slug: <code>{site?.slug || "—"}</code>
      </p>

      <section
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24
        }}
        className="central-admins-section"
      >
        <form
          onSubmit={add}
          style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: 12,
            padding: 20
          }}
        >
          <h2 style={{ fontSize: 16, marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} /> Добавить администратора
          </h2>
          <label style={{ display: "block", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>Логин</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="central-setup__field-input"
            />
          </label>
          <label style={{ display: "block", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>Пароль (≥ 8)</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="central-setup__field-input"
            />
          </label>
          <label style={{ display: "block", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>Роль</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="central-setup__field-input"
            >
              <option value="owner">Owner (полный доступ)</option>
              <option value="manager">Manager (управление товарами)</option>
              <option value="viewer">Viewer (только просмотр)</option>
            </select>
          </label>
          {err && (
            <p style={{ color: "#FF5252", fontSize: 12, marginBottom: 12 }}>{err}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="central-btn central-btn--primary"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="spin" /> Создаём…
              </>
            ) : (
              <>
                <Plus size={14} /> Добавить
              </>
            )}
          </button>
        </form>

        <div
          style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: 12,
            padding: 20
          }}
        >
          <h2
            style={{
              fontSize: 16,
              marginTop: 0,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <Users size={16} /> Текущая команда ({admins.length})
          </h2>
          {admins.length === 0 ? (
            <p style={{ color: "#888" }}>Нет администраторов</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {admins.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #1a1a1a"
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 14 }}>{a.username}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#888" }}>
                      {a.role}
                      {a.last_login_at
                        ? ` · вошёл ${new Date(a.last_login_at).toLocaleString(
                            "ru"
                          )}`
                        : " · не входил"}
                    </p>
                  </div>
                  {a.role !== "owner" && (
                    <button
                      onClick={() => remove(a.id, a.username)}
                      className="central-btn central-btn--danger"
                      style={{ fontSize: 11, padding: "4px 8px" }}
                      aria-label={`Удалить: ${a.username}`}
                    >
                      <Trash2 size={12} /> Удалить
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 720px) {
          :global(.central-admins-section) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
