type Hits = { times: number[] };

// 单实例内存滑窗：Serverless 下每个热实例各算各的，属于尽力而为的缓解，
// 用来挡住脚本化的暴力尝试与刷分，不能当作跨实例配额。
const store = new Map<string, Hits>();
const MAX_KEYS = 2000;

export function clientKey(req: Request, scope: string, identity: string | number): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `${scope}:${identity}:${ip}`;
}

function sweep(now: number, windowMs: number): void {
  for (const [key, hits] of store) {
    if (!hits.times.length || now - hits.times[hits.times.length - 1] > windowMs) store.delete(key);
  }
}

/** 返回 true 表示放行；false 表示已超出窗口内的次数上限。 */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (store.size > MAX_KEYS) sweep(now, windowMs);
  let hits = store.get(key);
  if (!hits) {
    hits = { times: [] };
    store.set(key, hits);
  }
  const cutoff = now - windowMs;
  while (hits.times.length && hits.times[0] < cutoff) hits.times.shift();
  if (hits.times.length >= limit) return false;
  hits.times.push(now);
  return true;
}

/** 距窗口内最早一次请求还有多少秒重新可用。 */
export function retryAfter(key: string, windowMs: number): number {
  const hits = store.get(key);
  if (!hits?.times.length) return Math.ceil(windowMs / 1000);
  return Math.max(1, Math.ceil((windowMs - (Date.now() - hits.times[0])) / 1000));
}
