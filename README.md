# Arcade Hub · 霓虹街机游戏厅

部署在 Vercel 的在线街机游戏门户：站内自带 40 款经典小游戏（全部支持排行榜），用户可注册登录、收藏、评分、提交成绩冲击全站排行榜，管理员有完整的游戏 / 用户 / 数据管理后台。

**线上地址**：<https://arcade-hub-nu.vercel.app>（Vercel 默认域名在大陆网络直连可能超时，需代理访问；可绑定自定义域名解决）

## 功能总览

| 模块 | 说明 |
| --- | --- |
| 🎮 游戏门户 | 首页精选轮播（hover 暂停）/ 最热 / 最新、分类浏览、搜索、游戏详情页 |
| 🕹️ 站内游戏 | 2048（含撤销）、贪吃蛇（三档难度+暂停）、俄罗斯方块（下一块预览+暂停）、扫雷（首点保护+最佳时间）、打砖块（P 暂停）、记忆翻牌、打地鼠、记忆序列、霓虹小鸟、井字棋、数字华容道、太空射击、24 点速算、五子棋（三档 AI + 悔棋）、接金币、像素跑酷、记忆数字、打字练习、手速测试、迷宫寻宝、瞄准训练、高低猜牌、成语填空、迷你数独、弹幕求生、霓虹弹球、霓虹豆豆、石头剪刀布（自研实现，零外部依赖） |
| 🔊 音效与音乐 | 全站共享 WebAudio 芯片音乐 / 音效引擎（程序化合成，零音频文件），音量滑块 + 静音全站同步，切后台自动暂停 BGM |
| ❤️ 用户系统 | 邮箱注册 / 登录（JWT httpOnly Cookie）、收藏、5 星评分 |
| 🏆 排行榜 | 各游戏 Top10 + 玩家总榜（各游戏最高分之和）+ 游戏纪录榜（可按游戏筛选查看 Top10） |
| 🛠️ 管理后台 | 数据统计、游戏上架 / 下架 / 编辑 / 删除、精选位管理、用户角色管理 |
| 📊 数据统计 | 游玩次数自动计数，后台一览 Top10 游戏与最新用户；个人中心战绩总览卡 |
| 🔍 SEO | sitemap / robots / PWA manifest / OpenGraph，游戏页独立 metadata |

## 技术栈

- **Next.js 16 (App Router) + React 19 + Tailwind CSS v4**，暗色街机霓虹主题
- **Drizzle ORM + Neon Serverless Postgres**（Vercel Postgres，新加坡区，HTTP 驱动零冷启动）
- 认证：bcryptjs 密码哈希 + jose JWT（httpOnly Cookie），`middleware.ts` 保护 `/admin`
- Vercel Functions 区域：`hkg1`（香港，见 `vercel.json`）

## 本地开发

```bash
pnpm install
cp .env.example .env.local   # 填入 DATABASE_URL 与 JWT_SECRET
pnpm db:push                 # 建表
pnpm db:seed                 # 管理员 + 40 款游戏 + 演示数据
pnpm dev                     # http://localhost:3000
```

其他脚本：`pnpm build`（生产构建）、`node scripts/gen-thumbs.mjs`（重新生成 SVG 封面）。

## 部署（Vercel）

1. Vercel Dashboard → New Project → 导入本仓库（框架自动识别 Next.js）
2. Storage → Create Database → **Neon**，区域选 **Singapore**，连接到本项目（自动注入 `DATABASE_URL`）
3. Settings → Environment Variables 添加 `JWT_SECRET`（`openssl rand -hex 32`）
4. 本地执行一次 `pnpm db:push && pnpm db:seed`（使用生产 DATABASE_URL），或部署后在本地跑
5. 每次推送 main 分支自动重新部署

也可用 CLI：`vercel link && vercel --prod`。

## 默认账号

| 角色 | 账号 | 密码 | 来源 |
| --- | --- | --- | --- |
| 管理员 | `admin@arcadehub.local` | 部署时通过 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 环境变量设置（默认 `Arcade@2026`） | `pnpm db:seed` |
| 演示玩家 | `player1@demo.local` 等 3 个 | `demo123456` | `pnpm db:seed` |

> 上线后请立即修改管理员密码（后台或数据库），并删除演示用户。

## 如何新增游戏

- **第三方 iframe 游戏**：管理后台 → 游戏管理 → 上架新游戏 → 来源选「第三方 iframe」，粘贴嵌入地址（如 `https://html5.gamemonetize.com/<id>/`），保存即上架。
- **站内游戏**：在 `public/games/<slug>/index.html` 放入单文件游戏，游戏内 `<script src="/games/_bridge.js">` 并在结算时调用 `ArcadeBridge.submitScore(score)` 上报成绩；后台「上架新游戏」来源选「站内游戏」，标题与 slug 对应目录名即可。
- 封面：默认使用 `public/thumbs/<slug>.svg`（没有则回退 default.svg），后台也可直接填图片 URL。

## 成绩上报协议

站内游戏 → 父页面：`parent.postMessage({ type: "arcade:score", score: 123 }, "*")`
父页面 → 服务端：`POST /api/games/[slug]/scores`（需登录，按用户保留最高分）。

## 目录结构

## 运维备注（重要，勿改）

- **Vercel 项目设置里的 `framework` 必须是 `nextjs`。** 该字段若为空，构建产物不会包含 Next.js 的页面与 API 函数，线上只会剩下 `public/` 下的静态文件，其余全部路由都会返回平台级 404（`X-Vercel-Error: NOT_FOUND`）。此坑已踩过一次。
- 生产别名：`arcade-hub-nu.vercel.app`、`arcade-hub-adc-akeyuan.vercel.app`
- 推送 `main` 分支由 Vercel Git 集成自动部署，无需手动 `vercel --prod`。

## 目录结构

```
app/                 页面与 API 路由（App Router）
  admin/             管理后台（middleware 保护）
  api/               auth / games / profile / admin 接口
  game/[slug]/       游戏详情（iframe + 排行榜）
components/          Header / GameCard / GameFrame / 评分 / 收藏 / 轮播
db/                  Drizzle schema、连接、种子脚本
lib/                 认证、密码、游戏查询
public/games/        10 款站内小游戏（单文件）+ _bridge.js
public/thumbs/       生成的霓虹风 SVG 封面
scripts/             封面生成脚本
```
