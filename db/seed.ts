import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
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
    slug: "slide-puzzle",
    title: "数字华容道",
    description: "经典滑块拼图。点击或方向键移动数字块，把 1,2,3… 排回原位。三种难度，步数越少、速度越快得分越高。",
    category: "益智",
    sourceType: "builtin",
    plays: 210,
    sortOrder: 11,
  },
  {
    slug: "space-shooter",
    title: "太空射击",
    description: "驾驶霓虹战机迎击一波波敌机。←→或拖动移动、空格射击，第 4 波起出现双血粉机，看你能撑到第几波。",
    category: "动作",
    sourceType: "builtin",
    plays: 320,
    featured: true,
    sortOrder: 12,
  },
  {
    slug: "math-24",
    title: "24 点速算",
    description: "用 4 张牌各一次，配 + − × ÷ 和括号算出 24。每题限时 60 秒，连对有加成，内置可解性保证每题都有答案。",
    category: "益智",
    sourceType: "builtin",
    plays: 180,
    sortOrder: 13,
  },
  {
    slug: "gomoku",
    title: "五子棋 · 人机对战",
    description: "与评分式 AI 对弈五子棋，三档难度（防守权重不同）。你执白先行，五子连线即胜，连胜有额外加分。",
    category: "对战",
    sourceType: "builtin",
    plays: 260,
    sortOrder: 14,
  },
  {
    slug: "coin-catch",
    title: "接金币",
    description: "移动篮筐接住下落的金币，躲开炸弹香菇。漏接 8 个金币会扣命，速度会越来越快，考验手稳。",
    category: "休闲",
    sourceType: "builtin",
    plays: 200,
    sortOrder: 15,
  },
  {
    slug: "runner",
    title: "像素跑酷",
    description: "霓虹小人无尽跑酷。空格跳跃（支持二段跳），跳过尖刺和石块，速度会越来越快，看你能跑多远。",
    category: "街机",
    sourceType: "builtin",
    plays: 240,
    sortOrder: 16,
  },
  {
    slug: "number-memory",
    title: "记忆数字",
    description: "屏幕上闪现一串数字，凭记忆输入回来。每过一关数字多一位，看你的短期记忆能撑到几位数。",
    category: "益智",
    sourceType: "builtin",
    plays: 190,
    sortOrder: 17,
  },
  {
    slug: "typing-test",
    title: "打字练习",
    description: "60 秒英文打字速度测试，实时统计 WPM 和正确率，打错的字符会标红，练手速必备。",
    category: "益智",
    sourceType: "builtin",
    plays: 150,
    sortOrder: 18,
  },
  {
    slug: "click-speed",
    title: "手速测试",
    description: "10 秒内疯狂点击，测出你的 CPS（每秒点击数）。鼠标连点或手机连戳都行，和全世界比手速。",
    category: "休闲",
    sourceType: "builtin",
    plays: 170,
    sortOrder: 19,
  },
  {
    slug: "maze",
    title: "迷宫寻宝",
    description: "递归回溯算法随机生成的迷宫，方向键滑到 🏆 通关进入更深一层，通关越深分越高。",
    category: "益智",
    sourceType: "builtin",
    plays: 180,
    sortOrder: 20,
  },
  {
    slug: "aim-trainer",
    title: "瞄准训练",
    description: "20 秒内点中尽量多的移动靶标，目标越小分越高，空点扣正确率。练 FPS 枪法从这里开始。",
    category: "动作",
    sourceType: "builtin",
    plays: 200,
    sortOrder: 21,
  },
  {
    slug: "hi-lo",
    title: "高低猜牌",
    description: "猜下一张牌比当前更大 / 更小 / 相同，猜对连胜翻倍计分，猜错连胜清零。简单规则，刺激心理战。",
    category: "休闲",
    sourceType: "builtin",
    plays: 160,
    sortOrder: 22,
  },
  {
    slug: "idiom-quiz",
    title: "成语填空",
    description: "20 题成语填空，根据释义选出正确的字。连对有加成，答错会公布答案，寓教于乐。",
    category: "益智",
    sourceType: "builtin",
    plays: 140,
    sortOrder: 23,
  },
  {
    slug: "mini-sudoku",
    title: "迷你数独",
    description: "4×4 迷你数独，随机生成保证唯一解，实时冲突检测标红，比拼最快完成时间。",
    category: "益智",
    sourceType: "builtin",
    plays: 150,
    sortOrder: 24,
  },
  {
    slug: "bullet-dodge",
    title: "弹幕求生",
    description: "控制光点在三种弹幕模式（环形爆开 / 边缘散射 / 追踪弹）间求生，每 15 秒弹幕升级一档。",
    category: "动作",
    sourceType: "builtin",
    plays: 210,
    featured: true,
    sortOrder: 25,
  },
  {
    slug: "pong",
    title: "霓虹弹球",
    description: "经典 Pong 人机对战，先得 7 分者胜。AI 带反应延迟和误差，球速逐分加快，还原街机手感。",
    category: "经典",
    sourceType: "builtin",
    plays: 180,
    sortOrder: 26,
  },
  {
    slug: "pac-lite",
    title: "霓虹豆豆",
    description: "吃豆人玩法迷你版：吃光全部豆豆过关，躲开会学习的幽灵，吃到 ⭐ 反杀 5 秒。",
    category: "街机",
    sourceType: "builtin",
    plays: 230,
    sortOrder: 27,
  },
  {
    slug: "rps",
    title: "石头剪刀布",
    description: "和会学习出招习惯的 AI 玩石头剪刀布，80% 概率克制你的高频选择，考验心理博弈。",
    category: "休闲",
    sourceType: "builtin",
    plays: 170,
    sortOrder: 28,
  },
  {
    slug: "color-reflex",
    title: "颜色反应",
    description: "经典 Stroop 心理测试玩法：判断的是字的颜色而不是含义，绿色的「红」要点绿色。30 秒冲刺连击分。",
    category: "益智",
    sourceType: "builtin",
    plays: 150,
    sortOrder: 29,
  },
  {
    slug: "block-collapse",
    title: "同色消除",
    description: "点击 2 个以上相连的同色方块整组消除，组越大分越高（n²×5），全部清空额外 +500。",
    category: "益智",
    sourceType: "builtin",
    plays: 160,
    sortOrder: 30,
  },
  {
    slug: "jump-up",
    title: "霓虹跳跳",
    description: "Doodle Jump 玩法：自动弹跳不断向上，踩粉色断裂板会塌，看你能跳到多高。",
    category: "动作",
    sourceType: "builtin",
    plays: 200,
    sortOrder: 31,
  },
  {
    slug: "spot-diff",
    title: "找不同",
    description: "网格里藏着 1 个不同的表情，每两关格子更多，比拼眼力和手速，最佳纪录本地保存。",
    category: "休闲",
    sourceType: "builtin",
    plays: 140,
    sortOrder: 32,
  },
  {
    slug: "othello",
    title: "黑白棋",
    description: "经典 Reversi 人机对战：夹住对方棋子翻转成己方，AI 角位优先 + 贪心策略，终局子多者胜。",
    category: "对战",
    sourceType: "builtin",
    plays: 150,
    sortOrder: 33,
  },
  {
    slug: "stack-tower",
    title: "叠叠高",
    description: "方块来回摆动，看准时机放下。完美对齐不缩宽度，偏差会切掉一块，完全脱靶塔就倒。",
    category: "休闲",
    sourceType: "builtin",
    plays: 190,
    sortOrder: 34,
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
      playPath: g.sourceType === "builtin" ? `/games/${g.slug}/index.html` : null,
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
