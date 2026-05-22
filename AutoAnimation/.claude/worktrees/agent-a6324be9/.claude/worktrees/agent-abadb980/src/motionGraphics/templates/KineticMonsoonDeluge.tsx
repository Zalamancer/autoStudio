import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

/**
 * KineticMonsoonDeluge — Tropical monsoon sheets of driving rain.
 *
 * Metaphor: A torrential monsoon downpour where dense sheets of angled rain
 * cascade across the frame. Characters emerge as if the rain itself is forming
 * the letterforms — rivulets of water channelling into glyph shapes. Hold phase:
 * letters shimmer with running water surface and drip from serifs. Exit: the
 * deluge washes the text away, each letter dissolving into streaming runoff.
 */

interface MonsoonDelugeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Layer 1: Dense rain curtain — many angled streaks, driven by wind
    const rainDrops: React.ReactNode[] = []
    const numDrops = 35
    const windAngle = 15 + Math.sin(t * 0.3) * 5 // Wind gusts

    for (let i = 0; i < numDrops; i++) {
      const rx = width * rand(i * 43 + 7)
      const fallSpeed = 400 + rand(i * 19) * 300
      const ry = ((t * fallSpeed + rand(i * 67) * height * 4) % (height * 1.6)) - height * 0.3
      const dropLen = 20 + rand(i * 31) * 35
      const alpha = 0.08 + rand(i * 53) * 0.12
      const dropWidth = 1 + rand(i * 11) * 1.5

      rainDrops.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: rx,
            top: ry,
            width: dropWidth,
            height: dropLen,
            borderRadius: '0 0 1px 1px',
            background: `linear-gradient(180deg, transparent, rgba(160, 190, 220, ${alpha * 0.3}), rgba(160, 190, 220, ${alpha}))`,
            transform: `rotate(${windAngle + rand(i * 17) * 3}deg)`,
          }}
        />,
      )
    }

    // Layer 2: Horizontal rain sheet bands — dense water curtains
    const sheets: React.ReactNode[] = []
    for (let s = 0; s < 4; s++) {
      const sheetY = height * (0.1 + 0.25 * s) + Math.sin(t * 0.5 + s * 1.5) * 20
      const sheetAlpha = 0.03 + Math.sin(t * 0.4 + s) * 0.015

      sheets.push(
        <div
          key={`sh${s}`}
          style={{
            position: 'absolute',
            left: '-10%',
            right: '-10%',
            top: sheetY,
            height: height * 0.15,
            background: `linear-gradient(180deg,
              transparent,
              rgba(120, 160, 200, ${sheetAlpha}) 30%,
              rgba(100, 140, 180, ${sheetAlpha * 1.3}) 50%,
              rgba(120, 160, 200, ${sheetAlpha}) 70%,
              transparent)`,
            transform: `skewY(${2 + Math.sin(t * 0.3 + s) * 1.5}deg)`,
            mixBlendMode: 'screen',
          }}
        />,
      )
    }

    // Layer 3: Pooling water at bottom with ripples
    const poolRipples: React.ReactNode[] = []
    for (let p = 0; p < 8; p++) {
      const ripPhase = (t * 3 + rand(p * 71) * 5) % 2.5
      if (ripPhase > 1.5) continue
      const rp = ripPhase / 1.5
      const px = width * rand(p * 47 + 5)
      const size = 6 + rp * 30
      poolRipples.push(
        <div
          key={`rip${p}`}
          style={{
            position: 'absolute',
            left: px - size / 2,
            top: height * 0.88 - size * 0.15,
            width: size,
            height: size * 0.3,
            borderRadius: '50%',
            border: `1px solid rgba(140, 180, 220, ${(1 - rp) * 0.2})`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Monsoon sky gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg,
              rgba(20, 30, 45, 0.9) 0%,
              rgba(30, 45, 65, 0.7) 40%,
              rgba(25, 40, 55, 0.5) 70%,
              rgba(15, 25, 40, 0.3) 100%)`,
          }}
        />
        {sheets}
        <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen' }}>
          {rainDrops}
        </div>
        {/* Pool of water at bottom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '15%',
            background: 'linear-gradient(180deg, transparent, rgba(40, 60, 90, 0.25))',
          }}
        />
        {poolRipples}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Drip elements that fall from letters during hold and exit
    const drips: React.ReactNode[] = []

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let yOff = 0
      let blur = 0
      let clipReveal = 0 // vertical clip-path reveal

      if (phase === 'enter') {
        // Rain channelling into letter shapes — top-down reveal
        const delay = ci / (word.length + 1) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutExpo(p)

        charOpacity = Math.min(1, p * 3)
        // Reveal from top, like water filling a mould
        clipReveal = ep
        // Water surface blur during formation
        blur = (1 - ep) * 3
        yOff = (1 - ep) * -15
      } else if (phase === 'hold') {
        charOpacity = 1
        clipReveal = 1
        // Running water surface shimmer
        const shimmer = Math.sin(t * 5 + ci * 0.7) * 0.5 + 0.5
        yOff = Math.sin(t * 2 + ci * 0.5) * 1.5

        // Drips from bottom of letters — water weight pulling
        const dripPhase = (t * 1.2 + ci * 0.8 + rand(ci * 41 + index) * 3) % 3
        if (dripPhase < 1.5) {
          const dp = dripPhase / 1.5
          const dripLen = 5 + dp * 25
          const dripAlpha = (1 - dp) * 0.4
          drips.push(
            <div
              key={`dr${ci}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 2,
                height: dripLen,
                transform: `translate(calc(-50% + ${(ci - word.length / 2) * 52 + (rand(ci * 19) - 0.5) * 10}px), calc(-50% + 35px + ${dp * 30}px))`,
                borderRadius: '0 0 2px 2px',
                background: `linear-gradient(180deg, ${color}${Math.round(dripAlpha * 255).toString(16).padStart(2, '0')}, transparent)`,
              }}
            />,
          )
        }

        // Water surface highlight pulse
        blur = shimmer * 0.3
      } else {
        // Wash away — rain dissolves text, each letter streams downward
        const delay = ci / (word.length + 1) * 0.35
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.65))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep
        clipReveal = 1
        // Letters wash downward, stretching
        yOff = ep * 60
        blur = ep * 6
        // Runoff streaks below dissolving characters
        if (ep > 0.1) {
          const streakAlpha = (1 - ep) * 0.3
          drips.push(
            <div
              key={`rf${ci}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 3,
                height: 30 + ep * 60,
                transform: `translate(calc(-50% + ${(ci - word.length / 2) * 52}px), calc(-50% + 35px))`,
                borderRadius: '0 0 2px 2px',
                background: `linear-gradient(180deg, ${color}${Math.round(streakAlpha * 255).toString(16).padStart(2, '0')}, transparent)`,
                filter: 'blur(2px)',
              }}
            />,
          )
        }
      }

      // Clip-path for top-down water fill reveal
      const clipTop = clipReveal < 1 ? `inset(${(1 - clipReveal) * 100}% 0 0 0)` : undefined

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: 'transparent',
            opacity: charOpacity,
            transform: `translateY(${yOff}px)`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            clipPath: clipTop,
            // Water-filled text: translucent gradient fill
            backgroundImage: `linear-gradient(180deg, ${color}DD, ${color}88, ${color}BB)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextStroke: `1px ${color}90`,
            textShadow: `
              0 2px 6px rgba(60, 100, 150, 0.4),
              0 0 12px ${color}30
            `,
          }}
        >
          {ch}
        </span>
      )
    })

    // Splash particles on enter
    const splashes: React.ReactNode[] = []
    if (phase === 'enter') {
      for (let s = 0; s < 10; s++) {
        const sp = Math.max(0, Math.min(1, (enterProgress - 0.3 - s / 10 * 0.2) / 0.5))
        if (sp <= 0) continue
        const ep = easeOutQuad(sp)
        const angle = rand(s * 37 + index) * Math.PI - Math.PI / 2 // upward arc
        const dist = ep * 40 + rand(s * 23) * 20
        const sx = Math.cos(angle) * dist
        const sy = Math.sin(angle) * dist
        const size = 2 + rand(s * 13) * 3
        splashes.push(
          <div
            key={`sp${s}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size,
              height: size,
              borderRadius: '50%',
              transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`,
              background: `rgba(140, 180, 220, ${(1 - ep) * 0.4})`,
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {splashes}
        {drips}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function MonsoonDelugeComponent(props: MotionGraphicProps<MonsoonDelugeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-monsoon-deluge',
  title: 'Kinetic Monsoon Deluge',
  description:
    'Torrential monsoon rain sheets cascade across the frame as characters emerge through top-down water-fill reveals. Dense angled rain streaks with wind gusts, pooling ripples at the base, dripping serifs during hold, and a streaming wash-away exit.',
  tags: ['kinetic', 'typography', 'weather', 'monsoon', 'rain', 'deluge', 'water', 'atmospheric', 'tropical'],
  category: 'captions',
  component: MonsoonDelugeComponent as any,
  defaultConfig: {
    words: ['MONSOON', 'DELUGE', 'TORRENT', 'SURGE'],
    colors: ['#7CB8D4', '#5A9CB8', '#8CC8E0', '#4A8CA8'],
    bgColor: '#0a1420',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MONSOON', 'DELUGE', 'TORRENT', 'SURGE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#7CB8D4', '#5A9CB8', '#8CC8E0', '#4A8CA8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1420', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
