export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24" role="status" aria-label="加载中">
      <div className="flex gap-2">
        <span className="w-3 h-3 rounded-full bg-neon-cyan animate-pulse" />
        <span className="w-3 h-3 rounded-full bg-neon-pink animate-pulse [animation-delay:150ms]" />
        <span className="w-3 h-3 rounded-full bg-neon-yellow animate-pulse [animation-delay:300ms]" />
      </div>
      <p className="font-arcade text-[10px] text-slate-500 tracking-widest">LOADING…</p>
    </div>
  );
}
