import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { games, scores, users } from "./schema";
import { hashPassword } from "../lib/password";

const db = drizzle(neon(process.env.DATABASE_URL!), {});

type SeedGame = {
  slug: string;
  title: string;
  description: string;
  category: string;
  sourceType: "builtin" | "iframe";
  embedUrl?: string;
  plays: number;
  featured?: boolean;
  sortOrder: number;
};

const GAMES: SeedGame[] = [
  {
    slug: "2048",
    title: "2048",
    description:
      "经典数字合并游戏。使用方向键 / WASD 或滑动屏幕移动所有方块，相同数字碰撞合并，凑出 2048！分数等于所有合并值之和。",
    category: "益智",
    sourceType: "builtin",
    plays: 1280,
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "snake",
    title: "霓虹贪吃蛇",
    description:
      "街机厅永远的王者。吃掉霓虹光点让蛇不断变长，每 50 分提速一档。撞墙或咬到自己即结束，得分 = 光点数 × 10。",
    category: "经典",
    sourceType: "builtin",
    plays: 1560,
    featured: true,
    sortOrder: 2,
  },
  {
    slug: "tetris",
    title: "霓虹俄罗斯方块",
    description:
      "落下、旋转、消行！一次消多行有高额奖励分（1/2/3/4 行 = 100/300/500/800 × 等级）。每消 10 行升一级，速度越来越快。",
    category: "经典",
    sourceType: "builtin",
    plays: 990,
    featured: true,
    sortOrder: 3,
  },
  {
    slug: "minesweeper",
    title: "扫雷",
    description:
      "10×10 雷区埋着 15 颗地雷。点击翻开格子，数字表示周围雷数；右键或长按插旗。扫清全部安全格获胜：得分 = 剩余时间 × 5 + 300。",
    category: "益智",
    sourceType: "builtin",
    plays: 720,
    sortOrder: 4,
  },
  {
    slug: "breakout",
    title: "霓虹打砖块",
    description:
      "移动挡板把弹球射向砖墙，每块砖 10 分，清空全场 +500。球碰到挡板边缘会改变反弹角度，用走位控制球路吧。共 3 条命。",
    category: "街机",
    sourceType: "builtin",
    plays: 860,
    sortOrder: 5,
  },
  {
    slug: "memory",
    title: "记忆翻牌",
    description:
      "4×4 牌桌藏着 8 对街机图标，翻开全部配对即获胜。步数越少、用时越短，得分越高（1000 − 超额步数 × 20 − 秒数 × 2）。",
    category: "休闲",
    sourceType: "builtin",
    plays: 430,
    sortOrder: 6,
  },
  {
    slug: "whack-a-mole",
    title: "打地鼠",
    description: "30 秒限时模式！霓虹地鼠会随机从洞里探出头，看准了就敲。手速决定一切，敲中一只 +10 分。",
    category: "休闲",
    sourceType: "builtin",
    plays: 610,
    sortOrder: 7,
  },
  {
    slug: "simon",
    title: "记忆序列",
    description:
      "四块霓虹灯会按顺序闪烁并发出音阶，跟着重复即可过关。每关多加一步，坚持的关卡数 × 10 就是你的分数。",
    category: "益智",
    sourceType: "builtin",
    plays: 380,
    sortOrder: 8,
  },
  {
    slug: "flappy",
    title: "霓虹小鸟",
    description: "点击屏幕或按空格扇动翅膀，穿过一道道霓虹管道。每穿过一道 +1 分，碰到管道或坠地即结束。",
    category: "街机",
    sourceType: "builtin",
    plays: 1100,
    featured: true,
    sortOrder: 9,
  },
  {
    slug: "tictactoe",
    title: "井字棋 · 人机对战",
    description: "与中级 AI 对战井字棋。赢一局 +100、平局 +50、输了 +10（连胜会一直累积在连胜榜上）。",
    category: "对战",
    sourceType: "builtin",
    plays: 290,
    sortOrder: 10,
  },
  {
    slug: "taxi-rush",
    title: "Taxi Rush 出租车狂飙",
    description:
      "第三方精选 · 驾驶出租车穿过车流接客送货，赚到的钱可以升级座驾，一路冲上排行榜。（由 GameMonetize 提供，内含第三方广告）",
    category: "动作",
    sourceType: "iframe",
    embedUrl: "https://html5.gamemonetize.co/5jzzwvgh5ljmtvgawdsjtio83tpqry6f/",
    plays: 240,
    sortOrder: 11,
  },
  {
    slug: "cozy-sort",
    title: "Cozy Sort 治愈整理",
    description:
      "第三方精选 · 无时间压力的三消整理游戏，把可爱的物品分类归位，适合放松时来一局。（由 GameMonetize 提供，内含第三方广告）",
    category: "休闲",
    sourceType: "iframe",
    embedUrl: "https://html5.gamemonetize.co/xmiisth95yvktwdbitk08wl8wqz16w9b/",
    plays: 180,
    sortOrder: 12,
  },
  {
    slug: "boom-cell",
    title: "Boom Cell 细胞大战",
    description:
      "第三方精选 · 养育你的细胞军团吞噬对手，避开比自己大的群体，以小博大统一棋盘。（由 GameMonetize 提供，内含第三方广告）",
    category: "对战",
    sourceType: "iframe",
    embedUrl: "https://html5.gamemonetize.co/m3qnpahqdnc3eltlnsjev9u37g7ujt70/",
    plays: 150,
    sortOrder: 13,
  },
  {
    slug: "mine-keeper",
    title: "Mine Keeper 矮人矿镇",
    description:
      "第三方精选 · 扮演矮人领主，挖宝石、建小镇、抵御怪物入侵的模拟经营游戏。（由 GameMonetize 提供，内含第三方广告）",
    category: "休闲",
    sourceType: "iframe",
    embedUrl: "https://html5.gamemonetize.co/ra1s374djivnm6mmn1y8a3fodcttcwxg/",
    plays: 120,
    sortOrder: 14,
  },
];

const DEMO_USERS = [
  { email: "player1@demo.local", username: "像素骑士", plain: "demo123456" },
  { email: "player2@demo.local", username: "街机老炮儿", plain: "demo123456" },
  { email: "player3@demo.local", username: "霓虹青蛙", plain: "demo123456" },
];

// 演示成绩：每用户每游戏一条最高分
const DEMO_SCORES: Record<string, number[]> = {
  "2048": [1860, 1240, 760],
  snake: [260, 190, 120],
  tetris: [4820, 3160, 1520],
  minesweeper: [1150, 940, 0],
  breakout: [690, 540, 300],
  memory: [860, 720, 540],
  "whack-a-mole": [230, 180, 120],
  simon: [130, 90, 60],
  flappy: [34, 21, 9],
  tictactoe: [100, 100, 50],
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 未配置");
  if (/localhost|127\.0\.0\.1/.test(url)) {
    console.log("⚠️  当前是占位数据库连接，跳过种子。请先配置 Neon DATABASE_URL。");
    return;
  }

  // 管理员
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@arcadehub.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Arcade@2026";
  const adminExisting = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  if (adminExisting.length) {
    await db
      .update(users)
      .set({ role: "admin", passwordHash: hashPassword(adminPassword) })
      .where(eq(users.email, adminEmail));
    console.log(`管理员已存在，已重置密码：${adminEmail}`);
  } else {
    await db.insert(users).values({
      email: adminEmail,
      username: "admin",
      passwordHash: hashPassword(adminPassword),
      role: "admin",
    });
    console.log(`管理员已创建：${adminEmail} / ${adminPassword}`);
  }

  // 游戏入库（按 slug 幂等）
  for (const g of GAMES) {
    const values = {
      slug: g.slug,
      title: g.title,
      description: g.description,
      category: g.category,
      thumbnail: `/thumbs/${g.slug}.svg`,
      sourceType: g.sourceType,
      embedUrl: g.embedUrl ?? null,
      playPath: g.sourceType === "builtin" ? `/games/${g.slug}/` : null,
      plays: g.plays,
      hasScore: g.sourceType === "builtin",
      featured: g.featured ?? false,
      status: "published",
      sortOrder: g.sortOrder,
    };
    const existing = await db.select({ id: games.id }).from(games).where(eq(games.slug, g.slug)).limit(1);
    if (existing.length) {
      await db.update(games).set(values).where(eq(games.id, existing[0].id));
      console.log(`游戏已更新：${g.title}`);
    } else {
      await db.insert(games).values(values);
      console.log(`游戏已上架：${g.title}`);
    }
  }

  // 演示用户 + 成绩
  const demoRows = [];
  for (const u of DEMO_USERS) {
    const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
    if (existing.length) {
      demoRows.push(existing[0]);
    } else {
      const inserted = await db
        .insert(users)
        .values({ email: u.email, username: u.username, passwordHash: hashPassword(u.plain) })
        .returning();
      demoRows.push(inserted[0]);
      console.log(`演示用户已创建：${u.username}（密码 ${u.plain}）`);
    }
  }

  const slugToId = new Map(
    (await db.select({ id: games.id, slug: games.slug }).from(games)).map((r) => [r.slug, r.id])
  );
  for (const [slug, list] of Object.entries(DEMO_SCORES)) {
    const gameId = slugToId.get(slug);
    if (!gameId) continue;
    for (let i = 0; i < demoRows.length; i++) {
      const s = list[i];
      if (!s) continue;
      const dup = await db
        .select({ n: sql<number>`count(*)`.mapWith(Number) })
        .from(scores)
        .where(sql`${scores.userId} = ${demoRows[i].id} and ${scores.gameId} = ${gameId}`);
      if (dup[0]?.n === 0) {
        await db.insert(scores).values({ userId: demoRows[i].id, gameId, score: s });
      }
    }
  }
  console.log("演示成绩就绪 ✔");
  console.log("\n🎉 种子完成：14 款游戏 / 3 位演示玩家 / 1 位管理员");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
