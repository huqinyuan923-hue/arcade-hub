// 生成霓虹风格 SVG 游戏封面（400x300），输出到 public/thumbs/
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "thumbs");
mkdirSync(outDir, { recursive: true });

const GAMES = [
  { slug: "2048", emoji: "🔢", title: "2048", c1: "#22d3ee", c2: "#a855f7" },
  { slug: "snake", emoji: "🐍", title: "贪吃蛇", c1: "#a3e635", c2: "#22d3ee" },
  { slug: "tetris", emoji: "🧱", title: "俄罗斯方块", c1: "#a855f7", c2: "#f472b6" },
  { slug: "minesweeper", emoji: "💣", title: "扫雷", c1: "#fb923c", c2: "#7c3aed" },
  { slug: "breakout", emoji: "🧊", title: "打砖块", c1: "#22d3ee", c2: "#facc15" },
  { slug: "memory", emoji: "🃏", title: "记忆翻牌", c1: "#f472b6", c2: "#22d3ee" },
  { slug: "whack-a-mole", emoji: "🔨", title: "打地鼠", c1: "#facc15", c2: "#fb7185" },
  { slug: "simon", emoji: "🎯", title: "记忆序列", c1: "#a3e635", c2: "#a855f7" },
  { slug: "flappy", emoji: "🐤", title: "霓虹小鸟", c1: "#facc15", c2: "#22d3ee" },
  { slug: "tictactoe", emoji: "⭕", title: "井字棋", c1: "#22d3ee", c2: "#f472b6" },
  { slug: "taxi-rush", emoji: "🚕", title: "Taxi Rush", c1: "#facc15", c2: "#7c3aed" },
  { slug: "cozy-sort", emoji: "🧺", title: "Cozy Sort", c1: "#f472b6", c2: "#a3e635" },
  { slug: "boom-cell", emoji: "🧫", title: "Boom Cell", c1: "#a855f7", c2: "#22d3ee" },
  { slug: "mine-keeper", emoji: "⛏️", title: "Mine Keeper", c1: "#fb923c", c2: "#22d3ee" },
  { slug: "neon-asteroids", emoji: "☄️", title: "霓虹陨石", c1: "#22d3ee", c2: "#a855f7" },
  { slug: "neon-crossing", emoji: "🐸", title: "霓虹过河", c1: "#a3e635", c2: "#22d3ee" },
  { slug: "default", emoji: "🕹️", title: "Arcade Hub", c1: "#22d3ee", c2: "#f472b6" },
];

function grid(color) {
  let s = "";
  for (let x = 40; x < 400; x += 40) s += `<line x1="${x}" y1="0" x2="${x}" y2="300"/>`;
  for (let y = 40; y < 300; y += 40) s += `<line x1="0" y1="${y}" x2="400" y2="${y}"/>`;
  return `<g stroke="${color}" stroke-opacity=".12">${s}</g>`;
}

const svg = (g) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#151132"/><stop offset="1" stop-color="#0a0819"/>
  </linearGradient>
  <radialGradient id="g1" cx="30%" cy="18%" r="65%">
    <stop offset="0" stop-color="${g.c1}" stop-opacity=".38"/><stop offset="1" stop-color="${g.c1}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="g2" cx="82%" cy="92%" r="60%">
    <stop offset="0" stop-color="${g.c2}" stop-opacity=".34"/><stop offset="1" stop-color="${g.c2}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="400" height="300" fill="url(#bg)"/>
<rect width="400" height="300" fill="url(#g1)"/>
<rect width="400" height="300" fill="url(#g2)"/>
${grid(g.c1)}
<circle cx="200" cy="128" r="72" fill="${g.c1}" fill-opacity=".08"/>
<circle cx="200" cy="128" r="72" fill="none" stroke="${g.c1}" stroke-opacity=".35" stroke-width="1.5"/>
<text x="200" y="130" font-size="64" text-anchor="middle" dominant-baseline="central">${g.emoji}</text>
<text x="200" y="242" font-size="28" font-weight="800" fill="#e7e6f5" text-anchor="middle" font-family="system-ui,sans-serif">${g.title}</text>
<text x="200" y="274" font-size="12" fill="${g.c1}" text-anchor="middle" letter-spacing="5" font-family="monospace">ARCADE HUB · ${g.slug.toUpperCase()}</text>
</svg>
`;

for (const g of GAMES) {
  writeFileSync(join(outDir, `${g.slug}.svg`), svg(g));
  console.log("thumbs:", g.slug);
}
console.log(`完成：${GAMES.length} 张封面`);
