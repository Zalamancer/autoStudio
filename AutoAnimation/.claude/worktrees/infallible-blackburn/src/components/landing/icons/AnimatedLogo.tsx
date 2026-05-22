import { useRef, useEffect, useId } from 'react'

interface AnimatedLogoProps {
  className?: string
  /** Width & height in px (square). Default 280. */
  size?: number
  /** Full reveal cycle in ms. Default 6000. */
  duration?: number
  /** Hold time after reveal in ms. Default 3000. */
  hold?: number
  /** If true, plays once and holds. Default false (loops). */
  once?: boolean
}

/**
 * Animated ProAnimate logo — self-contained React component.
 *
 * Renders the PA film-strip logo with a layered reveal animation:
 *   border → background → gradient split → echo lines → P draws →
 *   A draws → film perfs scroll → play triangle pulses → wave fades in
 *
 * All SVG def IDs are scoped via useId() so multiple instances are safe.
 */
export function AnimatedLogo({
  className = '',
  size = 280,
  duration = 6000,
  hold = 3000,
  once = false,
}: AnimatedLogoProps) {
  const uid = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  const rafRef = useRef(0)

  // Scoped IDs for defs — avoids clashes when multiple logos render
  const id = (name: string) => `al-${uid}-${name}`

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const $ = (sel: string) => svg.querySelector(sel) as SVGElement | null
    const $$ = (sel: string) => svg.querySelectorAll(sel) as NodeListOf<SVGElement>

    const CYCLE = duration + hold
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const clamp = (v: number) => Math.max(0, Math.min(1, v))

    let playStarted = false
    const start = performance.now()

    function update() {
      const raw = performance.now() - start
      const elapsed = once ? Math.min(raw, duration) : raw % CYCLE
      const p = clamp(elapsed / duration)

      // Border stroke draw
      const border = $('[data-l="border"]')
      if (border) {
        const bT = ease(clamp(p / 0.12))
        border.style.opacity = bT > 0 ? '1' : '0'
        border.style.strokeDashoffset = String(2000 * (1 - bT))
      }

      // Dark background fade
      const bg = $('[data-l="bg"]')
      if (bg) bg.style.opacity = String(ease(clamp((p - 0.10) / 0.08)))

      // Green split slide
      const sp = $('[data-l="split"]')
      if (sp) {
        const spT = ease(clamp((p - 0.18) / 0.10))
        sp.style.opacity = String(spT)
        sp.style.transform = `translateX(${(1 - spT) * 80}px)`
      }

      // Echo lines
      const ec = $('[data-l="echoes"]')
      if (ec) ec.style.opacity = String(ease(clamp((p - 0.28) / 0.10)))

      // P letter draw (both sides)
      const pT = ease(clamp((p - 0.38) / 0.15))
      const pE = $('[data-l="P"]')
      const pG = $('[data-l="P-green"]')
      if (pE) {
        pE.style.opacity = pT > 0 ? '1' : '0'
        $$('[data-l="P"] path').forEach((x) => { x.style.strokeDashoffset = String(800 * (1 - pT)) })
      }
      if (pG) {
        pG.style.opacity = pT > 0 ? '1' : '0'
        $$('[data-l="P-green"] path').forEach((x) => { x.style.strokeDashoffset = String(800 * (1 - pT)) })
      }

      // A letter draw (both sides)
      const aT = ease(clamp((p - 0.53) / 0.15))
      const aE = $('[data-l="A"]')
      const aG = $('[data-l="A-green"]')
      if (aE) aE.style.opacity = aT > 0 ? '1' : '0'
      if (aG) aG.style.opacity = aT > 0 ? '1' : '0'
      $$('[data-l="A"] path, [data-l="A-green"] path').forEach((x) => {
        x.style.strokeDashoffset = String(500 * (1 - aT))
      })
      // A crossbar
      const cT = ease(clamp((p - 0.62) / 0.06))
      $$('[data-l="A"] line, [data-l="A-green"] line').forEach((l) => {
        l.style.opacity = String(cT * 0.85)
      })

      // Film perforations
      const pf = $('[data-l="perfs"]')
      if (pf) pf.style.opacity = String(ease(clamp((p - 0.68) / 0.10)))

      // Play triangle
      const pl = $('[data-l="play"]')
      if (pl) {
        const plT = ease(clamp((p - 0.78) / 0.10))
        pl.style.opacity = String(plT)
        if (plT > 0.5 && !playStarted) {
          playStarted = true
          ;(svg!.getElementById(id('playAnim')) as any)?.beginElement?.()
          ;(svg!.getElementById(id('playAnim2')) as any)?.beginElement?.()
        }
        if (plT < 0.1) playStarted = false
      }

      // Motion wave
      const wv = $('[data-l="wave"]')
      if (wv) wv.style.opacity = String(ease(clamp((p - 0.75) / 0.10)) * 0.3)

      if (once && raw >= duration) return
      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [duration, hold, once, id])

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
    >
      <defs>
        <linearGradient id={id('gb1')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id={id('gb1g')} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <filter id={id('glb1')}>
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={id('glb1s')}>
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id={id('lb1')}>
          <path d="M16 16 L340 16 L172 496 L16 496 Z" />
        </clipPath>
        <clipPath id={id('rb1')}>
          <path d="M340 16 L496 16 L496 496 L172 496 Z" />
        </clipPath>
        <clipPath id={id('rcb1')}>
          <rect x="16" y="16" width="480" height="480" rx="96" />
        </clipPath>
        <clipPath id={id('perfClipTop')}>
          <rect x="40" y="24" width="160" height="18" />
        </clipPath>
        <clipPath id={id('perfClipBot')}>
          <rect x="320" y="470" width="160" height="18" />
        </clipPath>
      </defs>

      {/* Border */}
      <rect
        data-l="border"
        x="16" y="16" width="480" height="480" rx="96"
        fill="none" stroke={`url(#${id('gb1')})`} strokeWidth="10"
        strokeDasharray="2000" strokeDashoffset="2000"
        style={{ opacity: 0 }}
      />

      <g clipPath={`url(#${id('rcb1')})`}>
        {/* Dark background */}
        <rect data-l="bg" x="16" y="16" width="480" height="480" fill="#050a05" style={{ opacity: 0 }} />

        {/* Green gradient split */}
        <g data-l="split" clipPath={`url(#${id('rb1')})`} style={{ opacity: 0 }}>
          <rect x="16" y="16" width="480" height="480" fill={`url(#${id('gb1g')})`} />
        </g>

        {/* Echo lines */}
        <g data-l="echoes" style={{ opacity: 0 }}>
          <line x1="320" y1="16" x2="152" y2="496" stroke="#4ade80" strokeWidth="1.5" opacity="0.15" filter={`url(#${id('glb1s')})`} />
          <line x1="340" y1="16" x2="172" y2="496" stroke="#4ade80" strokeWidth="5" opacity="0.9" filter={`url(#${id('glb1')})`} />
          <line x1="360" y1="16" x2="192" y2="496" stroke="#4ade80" strokeWidth="1" opacity="0.1" filter={`url(#${id('glb1s')})`} />
        </g>

        {/* P — dark side */}
        <g data-l="P" clipPath={`url(#${id('lb1')})`} style={{ opacity: 0 }}>
          <path
            d="M133 152 L133 360 M133 152 L241 152 C301 152 301 248 241 248 L133 248"
            fill="none" stroke="#4ade80" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round"
            filter={`url(#${id('glb1')})`}
            strokeDasharray="800" strokeDashoffset="800"
          />
        </g>

        {/* P — green side */}
        <g data-l="P-green" clipPath={`url(#${id('rb1')})`} style={{ opacity: 0 }}>
          <path
            d="M133 152 L133 360 M133 152 L241 152 C301 152 301 248 241 248 L133 248"
            fill="none" stroke="#0a0a0a" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="800" strokeDashoffset="800"
          />
        </g>

        {/* A — dark side */}
        <g data-l="A" clipPath={`url(#${id('lb1')})`} style={{ opacity: 0 }}>
          <path
            d="M265 360 L337 152 L409 360"
            fill="none" stroke="#22c55e" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round"
            filter={`url(#${id('glb1')})`}
            strokeDasharray="500" strokeDashoffset="500"
          />
          <line x1="289" y1="275" x2="385" y2="275" stroke="#22c55e" strokeWidth="20" strokeLinecap="round" style={{ opacity: 0 }} />
        </g>

        {/* A — green side */}
        <g data-l="A-green" clipPath={`url(#${id('rb1')})`} style={{ opacity: 0 }}>
          <path
            d="M265 360 L337 152 L409 360"
            fill="none" stroke="#ffffff" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="500" strokeDashoffset="500"
          />
          <line x1="289" y1="275" x2="385" y2="275" stroke="rgba(255,255,255,0.85)" strokeWidth="20" strokeLinecap="round" style={{ opacity: 0 }} />
        </g>

        {/* Film strip perforations */}
        <g data-l="perfs" style={{ opacity: 0 }}>
          <g clipPath={`url(#${id('perfClipTop')})`} opacity="0.2">
            <g style={{ animation: 'al-perfLeft 1.2s linear infinite' }}>
              {[46, 72, 98, 124, 150, 176, 202].map((x) => (
                <rect key={x} x={x} y="28" width="14" height="10" rx="2" fill="#4ade80" />
              ))}
            </g>
          </g>
          <g clipPath={`url(#${id('perfClipBot')})`} opacity="0.2">
            <g style={{ animation: 'al-perfRight 1.2s linear infinite' }}>
              {[300, 326, 352, 378, 404, 430, 456].map((x) => (
                <rect key={x} x={x} y="474" width="14" height="10" rx="2" fill="#ffffff" />
              ))}
            </g>
          </g>
        </g>

        {/* Play triangle */}
        <g data-l="play" style={{ opacity: 0 }}>
          <g clipPath={`url(#${id('lb1')})`}>
            <path d="M170 178 L205 200 L170 222 Z" fill="#4ade80" opacity="0" filter={`url(#${id('glb1')})`}>
              <animate id={id('playAnim')} attributeName="opacity" values="0.25;0.55;0.25" dur="2s" repeatCount="indefinite" begin="indefinite" />
            </path>
          </g>
          <g clipPath={`url(#${id('rb1')})`}>
            <path d="M170 178 L205 200 L170 222 Z" fill="#0a0a0a" opacity="0">
              <animate id={id('playAnim2')} attributeName="opacity" values="0.2;0.45;0.2" dur="2s" repeatCount="indefinite" begin="indefinite" />
            </path>
          </g>
        </g>

        {/* Motion wave */}
        <path
          data-l="wave"
          d="M80 420 Q170 396 256 420 Q342 444 432 420"
          fill="none" stroke="#4ade80" strokeWidth="5" filter={`url(#${id('glb1')})`}
          style={{ opacity: 0 }}
        />
      </g>

      {/* Keyframe animations injected via <style> inside SVG (scoped, no global leaks) */}
      <style>{`
        @keyframes al-perfLeft { from { transform: translateX(0) } to { transform: translateX(-26px) } }
        @keyframes al-perfRight { from { transform: translateX(0) } to { transform: translateX(26px) } }
      `}</style>
    </svg>
  )
}
