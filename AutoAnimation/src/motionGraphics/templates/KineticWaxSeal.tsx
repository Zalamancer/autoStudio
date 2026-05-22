import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaxSealConfig extends KineticBaseConfig {
  sealColor: string
}

// Molten wax explodes outward then cools
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuad(t: number): number {
  return t * t
}

// Build a lumpy wax-blob polygon (24 vertices, seed-stable per render)
function sealClipPath(spread: number, wobbleT: number): string {
  const pts = 24
  const result: string[] = []
  for (let i = 0; i < pts; i++) {
    const angle = (i / pts) * Math.PI * 2 - Math.PI / 2
    const lump =
      Math.sin(i * 2.3 + 1.7) * 3.8 +
      Math.sin(i * 5.1 + 0.4) * 1.6 +
      Math.sin(wobbleT * 1.8 + i * 0.85) * (1 - spread) * 2.2
    const r = (38 + lump) * spread
    const x = 50 + Math.cos(angle) * r
    const y = 50 + Math.sin(angle) * r
    result.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`)
  }
  return `polygon(${result.join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        backgroundImage: `
          radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 55%),
          radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.18) 0%, transparent 55%)
        `,
      }}
    />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    holdProgress,
    phase,
    frame,
    fps,
  }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)

    let spread = 0       // 0→1 radius of wax blob
    let sealOpacity = 0
    let textOpacity = 0
    let textScale = 1
    let emboss = 0       // 0→1 depth of emboss effect
    let meltY = 0        // px droop on exit
    let wobbleT = time

    if (phase === 'enter') {
      spread = easeOutExpo(Math.min(1, enterProgress / 0.62))
      sealOpacity = Math.min(1, enterProgress * 9)
      textOpacity = easeOutQuart(Math.max(0, (enterProgress - 0.38) / 0.62))
      textScale = 0.55 + easeOutExpo(Math.max(0, (enterProgress - 0.38) / 0.62)) * 0.45
      emboss = Math.min(1, Math.max(0, (enterProgress - 0.44) / 0.4))
    } else if (phase === 'hold') {
      spread = 1
      sealOpacity = 1
      textOpacity = 1
      textScale = 1
      emboss = 1
    } else {
      const t = easeInQuad(exitProgress)
      spread = 1 - t * 0.14
      sealOpacity = 1 - exitProgress * exitProgress
      textOpacity = Math.max(0, 1 - exitProgress * 2.8)
      textScale = 1 - t * 0.09
      emboss = 1 - t
      meltY = t * 14
    }

    const clip = sealClipPath(spread, wobbleT)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Heat shimmer glow right after wax is dropped */}
        {phase === 'enter' && enterProgress < 0.45 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(88vw, 310px)',
              height: 'min(88vw, 310px)',
              borderRadius: '50%',
              opacity: Math.max(0, 0.45 - enterProgress),
              background: `radial-gradient(circle, ${color}66 0%, transparent 68%)`,
              filter: 'blur(14px)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Wax blob */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${meltY}px) scaleY(${1 - (meltY / 14) * 0.06})`,
            width: 'min(70vw, 252px)',
            height: 'min(70vw, 252px)',
            opacity: sealOpacity,
            clipPath: clip,
            background: `radial-gradient(ellipse at 38% 34%, rgba(255,255,255,0.24) 0%, transparent 52%), ${color}`,
            boxShadow: `inset 0 -5px 14px rgba(0,0,0,0.28), inset 0 4px 9px rgba(255,255,255,0.13)`,
          }}
        />

        {/* Embossed text pressed into wax */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${meltY}px) scale(${textScale})`,
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(26px, 6.5vw, 90px)',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: `rgba(0,0,0,${(0.32 + emboss * 0.32).toFixed(2)})`,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              textShadow:
                emboss > 0.08
                  ? `0 ${(emboss * 2.2).toFixed(1)}px ${(emboss * 3.5).toFixed(1)}px rgba(0,0,0,0.55),
                     0 -${(emboss * 1.1).toFixed(1)}px ${(emboss * 2).toFixed(1)}px rgba(255,255,255,0.18)`
                  : 'none',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function WaxSealComponent(props: MotionGraphicProps<WaxSealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wax-seal',
  title: 'Wax Seal',
  description:
    'Molten wax drops and spreads into an irregular lumpy blob — text is embossed into the cooling surface with a pressed-in shadow effect. Exit melts and droops the seal.',
  tags: ['kinetic', 'typography', 'wax', 'seal', 'postal', 'letter', 'luxury', 'emboss', 'vintage', 'royal'],
  category: 'captions',
  component: WaxSealComponent as any,
  defaultConfig: {
    words: ['SEALED', 'ROYAL', 'SENT', 'SECRET'],
    colors: ['#F5F0E8', '#F5F0E8', '#F5F0E8', '#F5F0E8'],
    bgColor: '#1A0800',
    cycleDuration: 1.8,
    sealColor: '#8B1A1A',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SEALED', 'ROYAL', 'SENT', 'SECRET'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#F5F0E8', '#F5F0E8', '#F5F0E8', '#F5F0E8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0800', group: 'Style' },
    { key: 'sealColor', label: 'Wax Color', type: 'color', defaultValue: '#8B1A1A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
