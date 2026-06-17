"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { addSiteAdmin, listCentralSites, listSiteAdmins, removeSiteAdmin } from "@/lib/multi-site/api";
import { useCentralAuthStore } from "@/lib/multi-site/store";
import type { CentralSiteAdmin, CentralSite } from "@/lib/multi-site/api";

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
    try {
      const list = await listCentralSites(token);
      setSite(list.find((s) => s.id === id) || null);
      const a = await listSiteAdmins(token, id);
      setAdmins(a);
    } catch (e: any) {
      setErr(e?.message || "load failed");
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id) return;
    setBusy(true);
    setErr(null);
    try {
      await addSiteAdmin(token, id, username, password, role);
      setUsername("");
      setPassword("");
      setRole("manager");
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "create failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(adminId: number) {
    if (!token || !id) return;
    if (!confirm("Удалить этого администратора?")) return;
    try {
      await removeSiteAdmin(token, id, adminId);
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "remove failed");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "'Manrope', system-ui, sans-serif", padding: 32 }}>
      <Link href="/central/dashboard" style={{ color: "#888", fontSize: 12, textDecoration: "none" }}>← К списку сайтов</Link>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: "12px 0 4px" }}>Команда сайта: {site?.name || "..."}</h1>
      <p style={{ color: "#888", fontSize: 13, margin: 0 }}>slug: {site?.slug}</p>

      <section style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <form onSubmit={add} style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Добавить администратора</h2>
          <label style={{ display: "block", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>Логин</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, background: "#000", color: "#fff", border: "1px solid #333", marginTop: 4 }} />
          </label>
          <label style={{ display: "block", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>Пароль (≥ 8)</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, background: "#000", color: "#fff", border: "1px solid #333", marginTop: 4 }} />
          </label>
          <label style={{ display: "block", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>Роль</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, background: "#000", color: "#fff", border: "1px solid #333", marginTop: 4 }}>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          {err && <p style={{ color: "#FF5252", fontSize: 12 }}>{err}</p>}
          <button type="submit" disabled={busy} style={{ padding: "10px 16px", borderRadius: 8, background: busy ? "#444" : "#00FF88", color: "#000", border: "none", fontWeight: 600, cursor: busy ? "default" : "pointer" }}>
            {busy ? "Создаём…" : "Добавить"}
          </button>
        </form>

        <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Текущая команда ({admins.length})</h2>
          {admins.length === 0 ? (
            <p style={{ color: "#888" }}>Нет администраторов</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {admins.map((a) => (
                <li key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14 }}>{a.username}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{a.role}{a.last_login_at ? ` · вошёл ${new Date(a.last_login_at).toLocaleString("ru")}` : " · не входил"}</p>
                  </div>
                  {a.role !== "owner" && (
                    <button onClick={() => remove(a.id)} style={{ padding: "6px 10px", borderRadius: 6, background: "transparent", border: "1px solid #FF5252", color: "#FF5252", cursor: "pointer", fontSize: 11 }}>
                      Удалить
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
