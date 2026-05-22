import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DustSettleRevealConfig extends KineticBaseConfig { particleCount: number }

function rand(s: number) { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
function easeOutQuart(t: number) { return 1 - Math.pow(1 - t, 4) }
function easeInCubic(t: number) { return t * t * t }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const motes = Array.from({ length: 7 }, (_, m) => {
      const drift = (t * (8 + rand(m * 29) * 6) + m * 60) % (width + 160)
      const my = height * (0.1 + rand(m * 41) * 0.8) + Math.sin(t * 0.3 + m * 0.9) * 15
      const mA = 0.025 + rand(m * 53) * 0.03
      return <div key={m} style={{ position: 'absolute', left: drift - 80, top: my, width: 50 + rand(m * 37) * 60, height: 15 + rand(m * 61) * 25, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(210,200,185,${mA}), transparent 70%)`, filter: 'blur(6px)' }} />
    })
    return <div style={{ position: 'absolute', inset: 0, background: bgColor }}>{motes}</div>
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const t = (frame ?? 0) / 30
    const cfg = (globalThis as any).__dustSettleConfig ?? { particleCount: 12 }
    const particleCount = cfg.particleCount ?? 12

    let settleProgress = 0, dustOpacity = 0, textBlur = 0, textOpacity = 0
    if (phase === 'enter') {
      const ep = easeOutQuart(enterProgress)
      settleProgress = ep; dustOpacity = 1 - ep; textBlur = (1 - ep) * 9
      textOpacity = easeOutQuart(Math.max(0, (enterProgress - 0.15) / 0.85))
    } else if (phase === 'hold') {
      settleProgress = 1; dustOpacity = 0; textBlur = 0.3 + Math.sin(t * 0.8) * 0.2; textOpacity = 1
    } else {
      const ep = easeInCubic(exitProgress)
      settleProgress = 1 - ep; dustOpacity = ep; textBlur = ep * 9; textOpacity = 1 - ep
    }

    const hazeY = height * 0.5 - settleProgress * height * 0.6
    const elems: React.ReactNode[] = [
      <div key="haze" style={{ position: 'absolute', left: -width * 0.1, top: hazeY - height * 0.3, width: width * 1.2, height: height * 0.8, background: `radial-gradient(ellipse at 50% 60%, rgba(190,180,160,${0.5 * dustOpacity}), rgba(170,160,140,${0.35 * dustOpacity}) 40%, transparent 70%)`, filter: 'blur(28px)' }} />,
    ]

    for (let p = 0; p < particleCount; p++) {
      const px = width * (0.03 + rand(p * 37 + index) * 0.94)
      const pSettled = Math.min(1, settleProgress * (0.5 + rand(p * 61 + index) * 0.7))
      const py = height * 0.5 + (1 - pSettled) * (rand(p * 43 + index) - 0.5) * height * 0.5 + pSettled * height * 0.55 + Math.sin(t * (0.6 + rand(p * 29) * 0.5) + p) * (1 - pSettled) * 8
      const pSize = 3 + rand(p * 53 + index) * 8
      const pAlpha = (0.15 + rand(p * 41) * 0.2) * dustOpacity * (1 - pSettled * 0.8)
      if (pAlpha < 0.01) continue
      elems.push(<div key={`dp${p}`} style={{ position: 'absolute', left: px - pSize / 2, top: py - pSize / 2, width: pSize, height: pSize * (0.4 + rand(p * 67) * 0.4), borderRadius: '50%', background: `rgba(200,190,170,${pAlpha})`, filter: 'blur(1.5px)' }} />)
    }

    const groundAlpha = settleProgress * 0.12 * dustOpacity
    if (groundAlpha > 0.005) {
      elems.push(<div key="ground" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: height * 0.15, background: `linear-gradient(180deg, transparent, rgba(180,170,150,${groundAlpha}))`, filter: 'blur(10px)' }} />)
    }

    const chars = word.split('').map((ch, ci) => {
      const d = Math.abs((word.length > 1 ? ci / (word.length - 1) : 0.5) - 0.5) * 2
      const clear = Math.max(0, settleProgress - d * 0.3)
      return (
        <span key={ci} style={{ display: 'inline-block', color, opacity: textOpacity * (0.3 + clear * 0.7), filter: textBlur * (0.5 + d * 0.5) * Math.max(0, 1 - clear) > 0.1 ? `blur(${textBlur * (0.5 + d * 0.5) * Math.max(0, 1 - clear)}px)` : 'none', textShadow: clear > 0.7 ? `0 0 18px ${color}45, 0 1px 4px rgba(0,0,0,0.5)` : 'none' }}>
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 'clamp(40px, 12vw, 155px)', fontWeight: 300, whiteSpace: 'nowrap', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {chars}
        </div>
        {elems}
      </div>
    )
  },
}

function DustSettleRevealComponent(props: MotionGraphicProps<DustSettleRevealConfig>) {
  ;(globalThis as any).__dustSettleConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dust-settle-reveal',
  title: 'Kinetic Dust Settle Reveal',
  description: 'Floating dust particles settle downward to reveal text emerging from the haze, with per-character center-out clearance and ambient drift',
  tags: ['kinetic', 'typography', 'dust', 'particles', 'settle', 'reveal', 'overlay', 'atmospheric', 'transition'],
  category: 'captions',
  component: DustSettleRevealComponent as any,
  defaultConfig: {
    words: ['SETTLE', 'GROUND', 'STILL', 'LAND'],
    colors: ['#F5EFE0', '#EDE4CF', '#FAF6EC', '#D9CDBA'],
    bgColor: '#100e09',
    cycleDuration: 1.5,
    particleCount: 12,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SETTLE', 'GROUND', 'STILL', 'LAND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5EFE0', '#EDE4CF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#100e09', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'particleCount', label: 'Particle Count', type: 'number', defaultValue: 12, min: 4, max: 20, group: 'Animation' },
  ],
})
