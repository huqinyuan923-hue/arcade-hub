"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "注册失败");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("网络异常，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="card p-8 flex flex-col gap-5">
        <div className="text-center">
          <h1 className="font-arcade text-lg text-neon-pink neon-text-pink mb-2">JOIN US</h1>
          <p className="text-sm text-slate-400">注册即加入霓虹街机，冲击排行榜</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-slate-300 block mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 outline-none focus:border-neon-cyan"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 block mb-1.5">用户名（2-20 位）</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 outline-none focus:border-neon-cyan"
              placeholder="街机高手"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 block mb-1.5">密码（至少 6 位）</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 outline-none focus:border-neon-cyan"
              placeholder="••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn-neon-pink py-2.5 rounded-xl font-semibold disabled:opacity-60"
          >
            {busy ? "注册中…" : "注册并登录"}
          </button>
        </form>

        <p className="text-sm text-slate-400 text-center">
          已有账号？
          <Link href="/login" className="text-neon-cyan hover:underline ml-1">
            直接登录
          </Link>
        </p>
      </div>
    </div>
  );
}
