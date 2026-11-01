'use client'

import { useEffect, useState } from 'react'

/**
 * 进站引导动画（街机开机风，每会话一次）。
 * 单时钟状态机：layout 内联脚本 playing → 双 rAF → go（CSS 起播），
 * 本组件负责水合后门控淡出——进度条 ah-fill 结束 +150ms 才加 boot-exiting，
 * 淡出动画 ah-exit 结束后切 done 卸载；水合晚于进度条结束时用 getAnimations 补收尾。
 */

const AH_HISCORE = [
  { rank: '1ST', score: '999990', who: 'ADC' },
  { rank: '2ND', score: '842110', who: 'CAT' },
  { rank: '3RD', score: '733020', who: 'YOU' },
]

const AH_PIXELS = 8

const FILL_ANIM = 'ah-fill'
const EXIT_ANIM = 'ah-exit'
const BOOT_FALLBACK_MS = 3400
const EXIT_FALLBACK_MS = 1200

type BootWindow = Window & { __bootT0?: number }

export function EntranceOverlay() {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (root.dataset.boot === 'done') {
      setGone(true)
      return
    }

    let fillTimer = 0
    let fallbackTimer = 0
    let finishTimer = 0

    const finish = () => {
      if (root.dataset.boot === 'done') return
      root.classList.remove('boot-exiting')
      root.dataset.boot = 'done'
      setGone(true)
    }
    const startExit = () => {
      if (root.dataset.boot === 'done' || root.classList.contains('boot-exiting')) return
      root.classList.add('boot-exiting')
      finishTimer = window.setTimeout(finish, EXIT_FALLBACK_MS)
    }
    const onAnimEnd = (e: AnimationEvent) => {
      if (e.animationName === EXIT_ANIM) finish()
      else if (e.animationName === FILL_ANIM) {
        // 进度条跑满后再留一拍，保证高分榜 / READY 都播完才淡出
        fillTimer = window.setTimeout(startExit, 200)
      }
    }
    document.addEventListener('animationend', onAnimEnd)

    if (root.dataset.boot !== 'playing' && root.dataset.boot !== 'go') {
      finish()
      return () => document.removeEventListener('animationend', onAnimEnd)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return () => document.removeEventListener('animationend', onAnimEnd)
    }

    // 内联脚本的起播 rAF 若被主线程卡住，这里补一个时钟锚点
    if (root.dataset.boot === 'playing') {
      root.dataset.boot = 'go'
      ;(window as BootWindow).__bootT0 = performance.now()
    }
    const t0 = (window as BootWindow).__bootT0 ?? performance.now()

    // 水合晚于进度条结束时，animationend 已经错过：直接补一个短收尾
    const overlay = document.querySelector<HTMLElement>('.ah-boot')
    const fill = overlay
      ?.getAnimations({ subtree: true })
      .find((a) => (a as CSSAnimation).animationName === FILL_ANIM)
    const fillEnd =
      fill && fill.startTime !== null
        ? Number(fill.startTime) + Number(fill.effect?.getComputedTiming().endTime ?? 0)
        : 0
    if (fillEnd > 0 && fillEnd <= performance.now()) {
      fillTimer = window.setTimeout(startExit, 200)
    }

    fallbackTimer = window.setTimeout(
      startExit,
      Math.max(0, t0 + BOOT_FALLBACK_MS - performance.now())
    )

    return () => {
      document.removeEventListener('animationend', onAnimEnd)
      window.clearTimeout(fillTimer)
      window.clearTimeout(fallbackTimer)
      window.clearTimeout(finishTimer)
    }
  }, [])

  if (gone) return null

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
html[data-boot='done'] .ah-boot{display:none}
.ah-boot{position:fixed;inset:0;z-index:9999;display:none;flex-direction:column;align-items:center;justify-content:center;gap:15px;background:radial-gradient(ellipse 80% 55% at 50% 32%,rgba(168,85,247,.12),transparent),#0d0b1e;font-family:var(--font-geist-sans),system-ui,sans-serif;overflow:hidden}
html[data-boot='playing'] .ah-boot,html[data-boot='go'] .ah-boot{display:flex}
html.boot-exiting .ah-boot{animation:ah-exit .5s cubic-bezier(.65,0,.35,1) forwards}
@keyframes ah-exit{to{opacity:0;visibility:hidden;transform:scale(1.04)}}
.ah-boot .ah-logo{font-family:var(--font-press-start),var(--font-geist-mono),monospace;font-size:clamp(20px,4.4vw,42px);font-weight:400;letter-spacing:.04em;line-height:1.25;color:transparent;background:linear-gradient(100deg,#22d3ee,#a855f7);-webkit-background-clip:text;background-clip:text;text-align:center}
.ah-boot .ah-coin{font-family:var(--font-press-start),var(--font-geist-mono),monospace;font-size:clamp(10px,1.6vw,14px);letter-spacing:.22em;color:#facc15}
.ah-boot .ah-caret{display:inline-block;width:.62em;text-align:center;color:#22d3ee;animation:ah-blink 1.1s steps(1,end) infinite}
@keyframes ah-blink{0%,55%{opacity:1}56%,100%{opacity:0}}
/* CRT 开机：一条横线纵向拉开（transform，不做 blur） */
.ah-boot .ah-crt{width:min(340px,66vw);height:46px;border-radius:6px;background:linear-gradient(180deg,rgba(34,211,238,.55),rgba(168,85,247,.5));box-shadow:0 0 22px rgba(34,211,238,.45);opacity:0;transform:scaleY(.02);transform-origin:center}
html[data-boot='go'] .ah-boot .ah-crt{animation:ah-crt .55s cubic-bezier(.2,.7,.3,1) .05s both}
@keyframes ah-crt{0%{opacity:1;transform:scaleY(.02)}55%{opacity:1;transform:scaleY(1)}100%{opacity:0;transform:scaleY(1)}}
/* 投币 */
.ah-boot .ah-drop{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:52px}
.ah-boot .ah-drop span{font-size:26px;line-height:1;opacity:0;transform:translateY(-46px)}
html[data-boot='go'] .ah-boot .ah-drop span{animation:ah-drop .45s cubic-bezier(.5,0,.25,1) .55s both}
@keyframes ah-drop{from{opacity:0;transform:translateY(-46px) scale(.85)}60%{opacity:1;transform:translateY(0) scale(1)}78%{transform:translateY(-7px) scale(1)}to{opacity:1;transform:none}}
.ah-boot .ah-slot{width:54px;height:7px;border:2px solid #22d3ee;border-radius:2px;background:rgba(34,211,238,.5);opacity:0}
html[data-boot='go'] .ah-boot .ah-slot{animation:ah-pop .25s cubic-bezier(.34,1.56,.64,1) .55s both,ah-flash .3s steps(1,end) .98s both}
@keyframes ah-pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}
@keyframes ah-flash{0%{opacity:1}40%{opacity:.25}100%{opacity:1}}
/* 像素方块逐个点亮 */
.ah-boot .ah-pix{display:flex;gap:7px;height:14px}
.ah-boot .ah-pix b{width:14px;height:14px;border-radius:2px;background:#22d3ee;opacity:0}
.ah-boot .ah-pix b:nth-child(even){background:#a855f7}
html[data-boot='go'] .ah-boot .ah-pix b{animation:ah-pix .18s cubic-bezier(.2,.9,.3,1) calc(1.05s + var(--i)*.06s) both}
@keyframes ah-pix{from{opacity:0;transform:scale(.35)}to{opacity:1;transform:none}}
/* 高分榜 */
.ah-boot .ah-hs{display:flex;flex-direction:column;gap:5px;font-family:var(--font-press-start),var(--font-geist-mono),monospace;font-size:clamp(9px,1.35vw,12px);letter-spacing:.12em;min-width:min(280px,66vw)}
.ah-boot .ah-hs .row{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;color:#94a3b8;opacity:0}
.ah-boot .ah-hs .row .sc{color:#22d3ee;text-align:center}
.ah-boot .ah-hs .row .who{color:#facc15}
.ah-boot .ah-hs .row:nth-child(1) .who{color:#a3e635}
html[data-boot='go'] .ah-boot .ah-hs .row{animation:ah-in .3s cubic-bezier(.2,.7,.3,1) calc(1.5s + var(--i)*.17s) both}
@keyframes ah-in{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
/* 进度条（像素风）+ 百分比 */
.ah-boot .ah-bar{width:min(300px,60vw);height:5px;border-radius:999px;overflow:hidden;background:rgba(168,85,247,.18);opacity:0}
html[data-boot='go'] .ah-boot .ah-bar{animation:ah-in .3s ease .45s both}
.ah-boot .ah-bar::before{content:'';display:block;height:100%;background:repeating-linear-gradient(90deg,#22d3ee 0 14px,#0d0b1e 14px 18px);transform:scaleX(0);transform-origin:left}
html[data-boot='go'] .ah-boot .ah-bar::before{animation:ah-fill 1.9s steps(19) .6s forwards}
@keyframes ah-fill{to{transform:scaleX(1)}}
@property --ahn{syntax:'<integer>';initial-value:0;inherits:false}
.ah-boot .ah-pct{font-family:var(--font-press-start),var(--font-geist-mono),monospace;font-size:clamp(9px,1.3vw,11px);letter-spacing:.14em;color:#22d3ee;opacity:0;counter-reset:ahn var(--ahn)}
.ah-boot .ah-pct::after{content:counter(ahn) '%'}
html[data-boot='go'] .ah-boot .ah-pct{animation:ah-in .3s ease .5s both,ah-count 1.9s steps(19) .6s both}
@keyframes ah-count{from{--ahn:0}to{--ahn:100}}
/* 收尾文案 + 角标 */
.ah-boot .ah-ready{font-family:var(--font-press-start),var(--font-geist-mono),monospace;font-size:clamp(10px,1.5vw,13px);letter-spacing:.24em;color:#a3e635;opacity:0}
html[data-boot='go'] .ah-boot .ah-ready{animation:ah-in .3s ease 2.25s both}
.ah-boot .ah-credit{position:absolute;right:20px;bottom:16px;font-family:var(--font-press-start),var(--font-geist-mono),monospace;font-size:clamp(8px,1.2vw,11px);letter-spacing:.16em;color:#a855f7;opacity:0}
html[data-boot='go'] .ah-boot .ah-credit{animation:ah-in .3s ease 1.95s both}
@media (prefers-reduced-motion:reduce){html[data-boot='playing'] .ah-boot,html[data-boot='go'] .ah-boot{display:none}}
`,
        }}
      />
      <div className="ah-boot" aria-hidden="true">
        <div className="ah-logo">ARCADE HUB</div>
        <div className="ah-coin">
          INSERT COIN <span className="ah-caret">▮</span>
        </div>
        <div className="ah-crt" />
        <div className="ah-drop">
          <span>🪙</span>
          <i className="ah-slot" />
        </div>
        <div className="ah-pix">
          {Array.from({ length: AH_PIXELS }, (_, i) => (
            <b key={i} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>
        <div className="ah-hs">
          {AH_HISCORE.map((r, i) => (
            <div key={r.rank} className="row" style={{ '--i': i } as React.CSSProperties}>
              <span>{r.rank}</span>
              <span className="sc">{r.score}</span>
              <span className="who">{r.who}</span>
            </div>
          ))}
        </div>
        <div className="ah-bar" />
        <div className="ah-pct" />
        <div className="ah-ready">PLAYER 1 READY</div>
        <div className="ah-credit">CREDIT 01</div>
      </div>
    </>
  )
}
