'use client'

import { useEffect, useState } from 'react'

/**
 * 进站引导动画（街机开机风，每会话一次）：
 * INSERT COIN 闪烁 → 投币 → PLAYER 1 READY → 整层淡出揭示。
 * 会话标记由 layout 内联脚本在文档开头完成；prefers-reduced-motion 直接跳过。
 */
export function EntranceOverlay() {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const onAnimEnd = (e: AnimationEvent) => {
      if (e.animationName === 'ah-exit') {
        document.documentElement.dataset.boot = 'done'
        setGone(true)
      }
    }
    document.addEventListener('animationend', onAnimEnd)
    const fallback = window.setTimeout(() => {
      document.documentElement.dataset.boot = 'done'
      setGone(true)
    }, 6000)
    return () => {
      document.removeEventListener('animationend', onAnimEnd)
      window.clearTimeout(fallback)
    }
  }, [])

  if (gone) return null

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
html[data-boot='done'] .ah-boot{display:none}
.ah-boot{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;background:radial-gradient(ellipse 80% 55% at 50% 32%,rgba(168,85,247,.12),transparent),#0d0b1e;font-family:var(--font-grotesk),system-ui,sans-serif;animation:ah-exit .55s cubic-bezier(.65,0,.35,1) 2.5s forwards}
.ah-boot .ah-logo{font-size:clamp(32px,7vw,64px);font-weight:700;letter-spacing:.06em;color:transparent;background:linear-gradient(100deg,#22d3ee,#a855f7);-webkit-background-clip:text;background-clip:text;animation:ah-in .55s cubic-bezier(.22,1,.36,1) both;text-shadow:none}
.ah-boot .ah-coin{font-family:var(--font-jetbrains-mono),monospace;font-size:clamp(13px,2vw,17px);letter-spacing:.35em;color:#facc15;animation:ah-in .3s ease .5s both,ah-blink .5s step-end .8s infinite}
.ah-boot .ah-ready{font-family:var(--font-jetbrains-mono),monospace;font-size:clamp(12px,1.8vw,15px);letter-spacing:.3em;color:#a3e635;opacity:0;animation:ah-in .35s ease 1.7s both}
.ah-boot .ah-bar{width:min(300px,60vw);height:4px;border-radius:999px;overflow:hidden;background:rgba(168,85,247,.18);animation:ah-in .3s ease .7s both}
.ah-boot .ah-bar::before{content:'';display:block;height:100%;background:repeating-linear-gradient(90deg,#22d3ee 0 14px,#0d0b1e 14px 18px);animation:ah-fill 1.4s steps(12) 0.7s forwards;transform-origin:left;transform:scaleX(0)}
@keyframes ah-in{from{opacity:0;transform:translateY(12px) scale(.96)}}
@keyframes ah-blink{50%{opacity:.15}}
@keyframes ah-fill{to{transform:scaleX(1)}}
@keyframes ah-exit{to{opacity:0;visibility:hidden;transform:scale(1.05)}}
@media (prefers-reduced-motion:reduce){.ah-boot{display:none}}
`,
        }}
      />
      <div className="ah-boot" aria-hidden="true">
        <div className="ah-logo">ARCADE HUB</div>
        <div className="ah-coin">INSERT COIN ▮</div>
        <div className="ah-bar" />
        <div className="ah-ready">PLAYER 1 READY</div>
      </div>
    </>
  )
}
