import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
const url = /^DATABASE_URL="?([^"\n]+)"?/m.exec(readFileSync(".env.local", "utf8"))?.[1];
const sql = neon(url!);
const caps: Record<string, number> = {
  tetris: 200000, "2048": 100000, "spot-diff": 80000, minesweeper: 60000, memory: 50000,
  breakout: 40000, "coin-catch": 20000, snake: 20000, "whack-a-mole": 20000,
  gomoku: 9000, connect4: 8000, simon: 7000, tictactoe: 5000, runner: 5000,
  "click-speed": 5000, "bullet-dodge": 5000, flappy: 5000, "pac-lite": 5000, "idiom-quiz": 5000,
};
const rows = Object.entries(caps).map(([s, c]) => `('${s}',${c}::int)`).join(", ");
try {
  const out = await sql.transaction([
    sql`with t(slug, cap) as (values ${sql.raw(rows)}) update games g set max_score = t.cap from t where t.slug = g.slug`,
    sql`update games set max_score = 300000 where status='published' and has_score and max_score is null`,
  ]);
  console.log("applied in one transaction:", JSON.stringify(out));
} catch (e: any) {
  console.log("ERROR:", e.message?.slice(0, 300));
}
