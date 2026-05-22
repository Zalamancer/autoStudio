import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LightShaftRevealConfig extends KineticBaseConfig { shaftCount: number }

function rand(s: number) { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
function easeOutExpo(t: number) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeInQuad(t: number) { return t * t }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const motes = Array.from({ length: 7 }, (_, m) => {
      const mx = width * (rand(m * 31) * 0.9 + 0.05)
      const my = (height * (rand(m * 47) * 0.8 + 0.1) - t * (15 + rand(m * 61) * 10)) % height
      const mA = 0.03 + rand(m * 53) * 0.04
      return <div key={m} style={{ position: 'absolute', left: mx - 40, top: my, width: 60 + rand(m * 37) * 60, height: 20 + rand(m * 29) * 30, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(255,240,200,${mA}), transparent 70%)`, filter: 'blur(8px)' }} />
    })
    return <div style={{ position: 'absolute', inset: 0, background: bgColor }}>{motes}</div>
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const t = (frame ?? 0) / 30
    const cfg = (globalThis as any).__lightShaftConfig ?? { shaftCount: 3 }
    const shaftCount = cfg.shaftCount ?? 3

    let sweepX = 0, trailFade = 0, textOpacity = 0
    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      sweepX = ep; trailFade = ep; textOpacity = ep
    } else if (phase === 'hold') {
      sweepX = 1; trailFade = 1; textOpacity = 1
    } else {
      const ep = easeInQuad(exitProgress)
      sweepX = 1; trailFade = 1 - ep; textOpacity = 1 - ep
    }

    const beamX = sweepX * (width + 200) - 100
    const beamW = 120 + Math.sin(t * 0.7) * 20
    const darkRight = sweepX * width + beamW * 0.5
    const darkAlpha = 0.85 * (phase === 'exit' ? easeInQuad(exitProgress) : (1 - sweepX) * 0.85)

    const shafts: React.ReactNode[] = [
      <div key="beam" style={{ position: 'absolute', top: -height * 0.2, left: beamX - beamW / 2, width: beamW, height: height * 1.4, background: 'linear-gradient(90deg, transparent, rgba(255,240,180,0.18) 30%, rgba(255,245,200,0.35) 50%, rgba(255,240,180,0.18) 70%, transparent)', filter: 'blur(12px)', transform: 'skewX(-8deg)' }} />,
    ]
    for (let s = 0; s < shaftCount; s++) {
      const sA = 0.06 * Math.max(0, 1 - (s / shaftCount) * 1.2)
      shafts.push(<div key={`sc${s}`} style={{ position: 'absolute', top: -height * 0.1, left: beamX + (s + 1) * (30 + rand(s * 41 + index) * 40) - 25, width: 40 + rand(s * 53) * 30, height: height * 1.2, background: `linear-gradient(90deg, transparent, rgba(255,240,180,${sA}), transparent)`, filter: 'blur(20px)', transform: 'skewX(-6deg)' }} />)
    }
    if (phase !== 'hold' || exitProgress > 0) {
      shafts.push(<div key="dark" style={{ position: 'absolute', top: 0, left: darkRight, width: Math.max(0, width - darkRight), height: '100%', background: `rgba(0,0,0,${darkAlpha})` }} />)
    }

    const chars = word.split('').map((ch, ci) => {
      const n = word.length > 1 ? ci / (word.length - 1) : 0.5
      const lit = n <= sweepX
      const bright = lit ? trailFade : 0
      return (
        <span key={ci} style={{ display: 'inline-block', color, opacity: textOpacity * (0.1 + bright * 0.9), filter: !lit ? 'blur(4px)' : 'none', textShadow: bright > 0.6 ? `0 0 25px rgba(255,240,180,0.6), 0 0 8px ${color}80` : 'none' }}>
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 'clamp(40px, 12vw, 155px)', fontWeight: 300, whiteSpace: 'nowrap', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {chars}
        </div>
        {shafts}
      </div>
    )
  },
}

function LightShaftRevealComponent(props: MotionGraphicProps<LightShaftRevealConfig>) {
  ;(globalThis as any).__lightShaftConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-light-shaft-reveal',
  title: 'Kinetic Light Shaft Reveal',
  description: 'A beam of light sweeps left-to-right; text materializes only where the light touches, then fades to darkness on exit',
  tags: ['kinetic', 'typography', 'light', 'shaft', 'beam', 'sweep', 'reveal', 'overlay', 'atmospheric', 'transition'],
  category: 'captions',
  component: LightShaftRevealComponent as any,
  defaultConfig: {
    words: ['ILLUMINATE', 'REVEAL', 'EXPOSE', 'LIGHT'],
    colors: ['#FFF8E8', '#FFE9B0', '#FFFDF0', '#FFD97A'],
    bgColor: '#06050a',
    cycleDuration: 1.3,
    shaftCount: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ILLUMINATE', 'REVEAL', 'EXPOSE', 'LIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFF8E8', '#FFE9B0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06050a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
    { key: 'shaftCount', label: 'Scatter Shafts', type: 'number', defaultValue: 3, min: 1, max: 6, group: 'Animation' },
  ],
})
