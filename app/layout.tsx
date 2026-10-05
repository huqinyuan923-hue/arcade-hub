import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import Link from "next/link";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://arcade-hub-nu.vercel.app"),
  title: {
    default: "Arcade Hub · 霓虹街机游戏厅",
    template: "%s · Arcade Hub",
  },
  description:
    "Arcade Hub 是一个在线街机游戏门户：2048、贪吃蛇、俄罗斯方块等经典小游戏即点即玩，支持用户收藏、评分与全站排行榜。",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  themeColor: "#0d0b1e",
  openGraph: {
    type: "website",
    siteName: "Arcade Hub",
    title: "Arcade Hub · 霓虹街机游戏厅",
    description: "2048、贪吃蛇、俄罗斯方块等 34 款经典小游戏即点即玩，冲击排行榜。",
    images: [{ url: "/icon.svg", width: 64, height: 64, alt: "Arcade Hub" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
        <footer className="border-t border-white/10 mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
            <p>
              <span className="font-arcade text-[10px] text-neon-cyan neon-text">ARCADE HUB</span>
              <span className="ml-3">霓虹街机 · 即点即玩</span>
            </p>
            <div className="flex gap-5">
              <Link href="/games" className="hover:text-neon-cyan transition-colors">
                全部游戏
              </Link>
              <Link href="/leaderboard" className="hover:text-neon-cyan transition-colors">
                排行榜
              </Link>
              <Link href="/profile" className="hover:text-neon-cyan transition-colors">
                个人中心
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
