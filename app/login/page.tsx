"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, password }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "登录失败");
        return;
      }
      router.push(next);
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
          <h1 className="font-arcade text-lg text-neon-cyan neon-text mb-2">WELCOME BACK</h1>
          <p className="text-sm text-slate-400">登录后可以收藏游戏、提交成绩上榜</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-slate-300 block mb-1.5">邮箱 / 用户名</label>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 outline-none focus:border-neon-cyan"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 block mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            className="btn-neon py-2.5 rounded-xl font-semibold disabled:opacity-60"
          >
            {busy ? "登录中…" : "登录"}
          </button>
        </form>

        <p className="text-sm text-slate-400 text-center">
          还没有账号？
          <Link href="/register" className="text-neon-cyan hover:underline ml-1">
            免费注册
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
