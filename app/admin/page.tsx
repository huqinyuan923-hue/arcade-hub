"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  totals: { games: number; users: number; plays: number; scores: number; favorites: number };
  topGames: { title: string; slug: string; plays: number; category: string }[];
  latestUsers: { id: number; username: string; email: string; role: string; createdAt: string }[];
  categoryDist: { category: string; n: number }[];
};

type AdminGame = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  sourceType: "builtin" | "iframe";
  embedUrl: string | null;
  plays: number;
  hasScore: boolean;
  featured: boolean;
  status: "published" | "hidden";
  avgRating: number;
  ratingCount: number;
};

type AdminUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  scoreCount: number;
};

const EMPTY_FORM = {
  title: "",
  category: "休闲",
  description: "",
  sourceType: "iframe" as "builtin" | "iframe",
  embedUrl: "",
  thumbnail: "",
  featured: false,
  hasScore: true,
  status: "published" as "published" | "hidden",
};

const CATEGORIES = ["益智", "动作", "经典", "街机", "休闲", "对战"];

export default function AdminPage() {
  const [tab, setTab] = useState<"stats" | "games" | "users">("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);

  const flash = (text: string) => {
    setMsg(text);
    window.setTimeout(() => setMsg(""), 3000);
  };

  const loadAll = useCallback(async () => {
    const [s, g, u] = await Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/games").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ]);
    setStats(s.totals ? s : null);
    setGames(g.games ?? []);
    setUsers(u.users ?? []);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function submitGame(e: React.FormEvent) {
    e.preventDefault();
    const url = editingId ? `/api/admin/games/${editingId}` : "/api/admin/games";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? partialPatch() : form),
    });
    const d = await res.json();
    if (!res.ok) {
      flash(`❌ ${d.error ?? "操作失败"}`);
      return;
    }
    flash(editingId ? "✅ 已保存修改" : "✅ 游戏已上架");
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    loadAll();
  }

  function partialPatch() {
    const p: Record<string, unknown> = {
      title: form.title,
      category: form.category,
      description: form.description,
      thumbnail: form.thumbnail,
      featured: form.featured,
      hasScore: form.hasScore,
      status: form.status,
    };
    if (form.sourceType === "iframe") p.embedUrl = form.embedUrl;
    return p;
  }

  function startEdit(g: AdminGame) {
    setEditingId(g.id);
    setForm({
      title: g.title,
      category: g.category,
      description: g.description,
      sourceType: g.sourceType,
      embedUrl: g.embedUrl ?? "",
      thumbnail: g.thumbnail,
      featured: g.featured,
      hasScore: g.hasScore,
      status: g.status,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleStatus(g: AdminGame) {
    const res = await fetch(`/api/admin/games/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: g.status === "published" ? "hidden" : "published" }),
    });
    if (res.ok) {
      flash(g.status === "published" ? "已下架" : "已上架");
      loadAll();
    }
  }

  async function toggleFeatured(g: AdminGame) {
    await fetch(`/api/admin/games/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !g.featured }),
    });
    loadAll();
  }

  async function removeGame(g: AdminGame) {
    if (!window.confirm(`确定删除「${g.title}」？其评分、收藏、成绩都会一并删除。`)) return;
    const res = await fetch(`/api/admin/games/${g.id}`, { method: "DELETE" });
    if (res.ok) {
      flash("已删除");
      loadAll();
    }
  }

  async function setUserRole(u: AdminUser, role: string) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, role }),
    });
    const d = await res.json();
    if (!res.ok) {
      flash(`❌ ${d.error ?? "操作失败"}`);
      return;
    }
    flash("角色已更新");
    loadAll();
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          🛠️ <span className="text-neon-pink neon-text-pink">管理后台</span>
        </h1>
        <div className="flex gap-2">
          {(
            [
              ["stats", "📊 统计"],
              ["games", "🎮 游戏管理"],
              ["users", "👥 用户"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                tab === key ? "bg-neon-cyan/20 border border-neon-cyan/60 text-neon-cyan" : "chip"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className="card px-4 py-2.5 text-sm text-neon-cyan border-neon-cyan/40">{msg}</div>
      )}

      {tab === "stats" && stats && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {(
              [
                ["🎮 游戏总数", stats.totals.games],
                ["👥 注册用户", stats.totals.users],
                ["▶ 总游玩次数", stats.totals.plays],
                ["🏆 成绩提交", stats.totals.scores],
                ["❤️ 收藏次数", stats.totals.favorites],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="card p-4 text-center">
                <p className="text-2xl font-bold text-neon-cyan font-mono">{value}</p>
                <p className="text-xs text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="font-semibold mb-3">🔥 游玩 Top 10</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {stats.topGames.map((g, i) => (
                  <li key={g.slug} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-slate-500 w-5">{i + 1}</span>
                    <Link href={`/game/${g.slug}`} className="flex-1 truncate hover:text-neon-cyan">
                      {g.title}
                    </Link>
                    <span className="text-xs chip px-2 py-0.5 rounded">{g.category}</span>
                    <span className="font-mono text-neon-cyan">{g.plays}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <h2 className="font-semibold mb-3">🆕 最新注册用户</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {stats.latestUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                    <span className="flex-1 truncate">
                      {u.username}
                      <span className="text-slate-500 text-xs ml-2">{u.email}</span>
                    </span>
                    {u.role === "admin" && <span className="text-xs text-neon-pink">admin</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === "games" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">共 {games.length} 款游戏（含未上架）</p>
            <button
              onClick={() => {
                setForm(EMPTY_FORM);
                setEditingId(null);
                setShowForm((v) => !v);
              }}
              className="btn-neon-pink px-4 py-2 rounded-xl text-sm font-semibold"
            >
              {showForm ? "收起表单" : "＋ 上架新游戏"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={submitGame} className="card p-5 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">标题 *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm outline-none focus:border-neon-cyan"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">分类</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm outline-none focus:border-neon-cyan"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0d0b1e]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 block mb-1">介绍</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm outline-none focus:border-neon-cyan"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">游戏来源</label>
                <div className="flex gap-3 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={form.sourceType === "iframe"}
                      onChange={() => setForm({ ...form, sourceType: "iframe" })}
                    />
                    第三方 iframe
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={form.sourceType === "builtin"}
                      onChange={() => setForm({ ...form, sourceType: "builtin" })}
                    />
                    站内游戏
                  </label>
                </div>
              </div>
              {form.sourceType === "iframe" && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">嵌入地址（https://…）</label>
                  <input
                    value={form.embedUrl}
                    onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
                    placeholder="https://html5.gamemonetize.com/xxxx/"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm outline-none focus:border-neon-cyan"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 block mb-1">封面图 URL（留空用默认）</label>
                <input
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm outline-none focus:border-neon-cyan"
                />
              </div>
              <div className="flex items-center gap-5 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  精选推荐
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.hasScore}
                    onChange={(e) => setForm({ ...form, hasScore: e.target.checked })}
                  />
                  有排行榜
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.status === "published"}
                    onChange={(e) => setForm({ ...form, status: e.target.checked ? "published" : "hidden" })}
                  />
                  上架
                </label>
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-neon px-6 py-2.5 rounded-xl font-semibold text-sm">
                  {editingId ? "保存修改" : "确认上架"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(EMPTY_FORM);
                    }}
                    className="ml-3 text-sm text-slate-400 hover:text-white"
                  >
                    取消编辑
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3">游戏</th>
                  <th className="text-left px-4 py-3">分类</th>
                  <th className="text-right px-4 py-3">游玩</th>
                  <th className="text-right px-4 py-3">评分</th>
                  <th className="text-center px-4 py-3">状态</th>
                  <th className="text-right px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.id} className="border-t border-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.thumbnail || "/thumbs/default.svg"}
                          alt=""
                          className="w-10 h-8 rounded object-cover bg-[#120f28]"
                        />
                        <div>
                          <Link href={`/game/${g.slug}`} className="hover:text-neon-cyan font-medium">
                            {g.title}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {g.sourceType === "iframe" ? "第三方" : "站内"}
                            {g.featured && <span className="text-neon-yellow ml-1">★精选</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{g.category}</td>
                    <td className="px-4 py-3 text-right font-mono">{g.plays}</td>
                    <td className="px-4 py-3 text-right font-mono text-neon-yellow">
                      {g.ratingCount ? g.avgRating.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleStatus(g)}
                        className={`text-xs px-2.5 py-1 rounded-md border ${
                          g.status === "published"
                            ? "border-emerald-400/40 text-emerald-300 bg-emerald-400/10"
                            : "border-slate-500/40 text-slate-400 bg-white/5"
                        }`}
                      >
                        {g.status === "published" ? "已上架" : "已下架"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => toggleFeatured(g)}
                        className="text-xs px-2 py-1 rounded hover:bg-white/10"
                        title="切换精选"
                      >
                        {g.featured ? "★" : "☆"}
                      </button>
                      <button onClick={() => startEdit(g)} className="text-xs px-2 py-1 rounded hover:bg-white/10">
                        编辑
                      </button>
                      <button
                        onClick={() => removeGame(g)}
                        className="text-xs px-2 py-1 rounded text-rose-400 hover:bg-rose-500/10"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">用户</th>
                <th className="text-left px-4 py-3">邮箱</th>
                <th className="text-right px-4 py-3">成绩数</th>
                <th className="text-center px-4 py-3">角色</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3 text-right font-mono">{u.scoreCount}</td>
                  <td className="px-4 py-3 text-center">
                    {u.role === "admin" ? (
                      <button
                        onClick={() => setUserRole(u, "user")}
                        className="text-xs px-2.5 py-1 rounded-md border border-neon-pink/50 text-neon-pink bg-neon-pink/10"
                        title="点击降级为普通用户"
                      >
                        admin ✕
                      </button>
                    ) : (
                      <button
                        onClick={() => setUserRole(u, "admin")}
                        className="text-xs px-2.5 py-1 rounded-md border border-white/20 text-slate-300 bg-white/5"
                        title="点击升级为管理员"
                      >
                        user ↑
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
