export type AchievementStats = {
  scoreCount: number;
  distinctGames: number;
  bestScore: number;
  playCount: number;
  favCount: number;
  ratingCount: number;
  totalCompletions: number;
  streak: number;
};

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  unlocked: boolean;
};

type Definition = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  unlocked: (s: AchievementStats) => boolean;
};

const DEFINITIONS: Definition[] = [
  {
    id: "first-score",
    icon: "🎬",
    title: "初次上榜",
    desc: "提交第一条成绩",
    unlocked: (s) => s.scoreCount >= 1,
  },
  {
    id: "explorer",
    icon: "🧭",
    title: "三面手",
    desc: "在 3 款不同游戏中留下成绩",
    unlocked: (s) => s.distinctGames >= 3,
  },
  {
    id: "allrounder",
    icon: "🎡",
    title: "十项全能",
    desc: "在 10 款不同游戏中留下成绩",
    unlocked: (s) => s.distinctGames >= 10,
  },
  {
    id: "veteran",
    icon: "🕹️",
    title: "百局老手",
    desc: "累计游玩 100 局",
    unlocked: (s) => s.playCount >= 100,
  },
  {
    id: "thousand",
    icon: "💯",
    title: "千分俱乐部",
    desc: "单局得分达到 1000",
    unlocked: (s) => s.bestScore >= 1000,
  },
  {
    id: "ten-thousand",
    icon: "🚀",
    title: "万分传奇",
    desc: "单局得分达到 10000",
    unlocked: (s) => s.bestScore >= 10000,
  },
  {
    id: "collector",
    icon: "❤️",
    title: "收藏家",
    desc: "收藏 5 款游戏",
    unlocked: (s) => s.favCount >= 5,
  },
  {
    id: "critic",
    icon: "⭐",
    title: "品鉴师",
    desc: "给 5 款游戏评分",
    unlocked: (s) => s.ratingCount >= 5,
  },
  {
    id: "challenger",
    icon: "🎯",
    title: "今日挑战者",
    desc: "完成一次每日挑战",
    unlocked: (s) => s.totalCompletions >= 1,
  },
  {
    id: "streak-7",
    icon: "🔥",
    title: "七日连击",
    desc: "连续 7 天完成每日挑战",
    unlocked: (s) => s.streak >= 7,
  },
];

export function evaluateAchievements(stats: AchievementStats): Achievement[] {
  return DEFINITIONS.map((d) => ({
    id: d.id,
    icon: d.icon,
    title: d.title,
    desc: d.desc,
    unlocked: d.unlocked(stats),
  }));
}
