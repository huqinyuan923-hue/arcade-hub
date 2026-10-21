import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAchievements } from "../lib/achievements";
import { dayKeyOf } from "../lib/daily";
import { MAX_SCORE, parseMaxScore, slugify } from "../lib/games";
import { allow, retryAfter } from "../lib/rate-limit";

test("dayKeyOf 按东八区切日", () => {
  assert.equal(dayKeyOf(new Date("2026-10-20T15:59:59.999Z")), "2026-10-20");
  assert.equal(dayKeyOf(new Date("2026-10-20T16:00:00.000Z")), "2026-10-21");
  assert.equal(dayKeyOf(new Date("2026-01-01T00:00:00.000Z")), "2026-01-01");
});

test("parseMaxScore 接受留空与合法上限", () => {
  assert.deepEqual(parseMaxScore(undefined), { ok: true, value: null });
  assert.deepEqual(parseMaxScore(null), { ok: true, value: null });
  assert.deepEqual(parseMaxScore(""), { ok: true, value: null });
  assert.deepEqual(parseMaxScore("1"), { ok: true, value: 1 });
  assert.deepEqual(parseMaxScore(1234.6), { ok: true, value: 1235 });
  assert.deepEqual(parseMaxScore(String(MAX_SCORE)), { ok: true, value: MAX_SCORE });
});

test("parseMaxScore 拒绝越界与非法值", () => {
  for (const bad of [0, -1, "abc", "Infinity", MAX_SCORE + 1, 1e12]) {
    assert.deepEqual(parseMaxScore(bad), { ok: false }, `应拒绝 ${String(bad)}`);
  }
});

test("slugify 生成可用且唯一的 ASCII slug", () => {
  assert.equal(slugify("  Hello, World!  "), "hello-world");
  assert.equal(slugify("Snake_2"), "snake-2");
  assert.equal(slugify("a--b"), "a-b");
  const chinese = slugify("俄罗斯方块");
  assert.match(chinese, /^game-[a-z0-9]+$/);
  assert.match(slugify("!!!"), /^game-[a-z0-9]+$/);
});

test("evaluateAchievements 依据统计解锁", () => {
  const locked = evaluateAchievements({
    scoreCount: 0,
    distinctGames: 0,
    bestScore: 0,
    playCount: 0,
    favCount: 0,
    ratingCount: 0,
    totalCompletions: 0,
    streak: 0,
  });
  assert.equal(locked.length, 10);
  assert.equal(new Set(locked.map((a) => a.id)).size, 10);
  assert.ok(locked.every((a) => !a.unlocked));

  const unlocked = evaluateAchievements({
    scoreCount: 30,
    distinctGames: 12,
    bestScore: 12000,
    playCount: 150,
    favCount: 6,
    ratingCount: 5,
    totalCompletions: 8,
    streak: 7,
  });
  assert.ok(unlocked.every((a) => a.unlocked));

  const partial = evaluateAchievements({
    scoreCount: 1,
    distinctGames: 3,
    bestScore: 1000,
    playCount: 99,
    favCount: 4,
    ratingCount: 0,
    totalCompletions: 1,
    streak: 6,
  });
  const byId = Object.fromEntries(partial.map((a) => [a.id, a.unlocked]));
  assert.equal(byId["first-score"], true);
  assert.equal(byId.explorer, true);
  assert.equal(byId.thousand, true);
  assert.equal(byId["ten-thousand"], false);
  assert.equal(byId.veteran, false);
  assert.equal(byId.collector, false);
  assert.equal(byId["streak-7"], false);
});

test("rate-limit 滑窗内拒绝、过期后恢复", (t) => {
  t.mock.timers.enable({ apis: ["Date"] });
  const key = "test:window";
  assert.equal(allow(key, 2, 10_000), true);
  assert.equal(allow(key, 2, 10_000), true);
  assert.equal(allow(key, 2, 10_000), false);
  assert.equal(retryAfter(key, 10_000), 10);

  t.mock.timers.tick(5_000);
  assert.equal(retryAfter(key, 10_000), 5);
  assert.equal(allow(key, 2, 10_000), false);

  t.mock.timers.tick(5_001);
  assert.equal(allow(key, 2, 10_000), true);
  assert.equal(retryAfter(key, 10_000), 10);
});

test("rate-limit 不同 key 互不影响", (t) => {
  t.mock.timers.enable({ apis: ["Date"] });
  assert.equal(allow("test:a", 1, 60_000), true);
  assert.equal(allow("test:a", 1, 60_000), false);
  assert.equal(allow("test:b", 1, 60_000), true);
});
