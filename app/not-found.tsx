import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <p className="font-arcade text-6xl text-neon-pink neon-text-pink">404</p>
      <h1 className="text-xl font-bold text-slate-200">这一格机台是空的…</h1>
      <p className="text-sm text-slate-400">你要找的页面不存在，可能被拔掉电源了。</p>
      <div className="flex gap-3">
        <Link href="/" className="px-5 py-2.5 rounded-xl btn-neon text-sm">
          🏠 回游戏厅
        </Link>
        <Link href="/games" className="px-5 py-2.5 rounded-xl btn-neon-pink text-sm">
          🕹️ 逛逛全部游戏
        </Link>
      </div>
    </div>
  );
}
