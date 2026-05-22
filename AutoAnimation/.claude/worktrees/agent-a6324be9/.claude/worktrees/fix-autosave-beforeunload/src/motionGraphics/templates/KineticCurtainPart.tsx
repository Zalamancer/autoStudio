import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CurtainPartConfig extends KineticBaseConfig {
  curtainColor: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const shimmerX = 50 + Math.sin(t * 0.4) * 8
    const shimmerY = 50 + Math.cos(t * 0.3) * 5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${shimmerX}% ${shimmerY}%, rgba(255,240,200,0.06), rgba(200,160,80,0.02) 40%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.25) 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__curtainPartConfig ?? { curtainColor: '#6B1515' }
    const curtainColor = cfg.curtainColor ?? '#6B1515'

    let curtainOffset = 0
    let textOpacity = 0
    let textScale = 1
    let textBlur = 0

    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      curtainOffset = ep
      textOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.15) / 0.85))
      textScale = 0.92 + ep * 0.08
      textBlur = (1 - ep) * 3
    } else if (phase === 'hold') {
      curtainOffset = 1
      textOpacity = 1
      textScale = 1 + Math.sin(t * 1.1 + index) * 0.003
      textBlur = 0
    } else {
      const ep = easeInExpo(exitProgress)
      curtainOffset = 1 - ep
      textOpacity = 1 - easeOutCubic(exitProgress)
      textScale = 1
      textBlur = ep * 3
    }

    const halfTravel = width * 0.52
    const leftCurtainX = -halfTravel * curtainOffset
    const rightCurtainX = halfTravel * curtainOffset

    // Per-character stagger tied to curtain reveal
    const chars = word.split('').map((ch, ci) => {
      const charNorm = word.length > 1 ? ci / (word.length - 1) : 0.5
      const charDelay = charNorm < 0.5 ? 0 : 0.05
      const charProgress = phase === 'enter'
        ? Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
        : 1
      const charOpacity = textOpacity * (phase === 'enter' ? easeOutCubic(charProgress) : 1)
      const charBlur = phase === 'enter' ? textBlur * (1 - charProgress) : textBlur

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            filter: charBlur > 0.2 ? `blur(${charBlur}px)` : 'none',
            textShadow: `0 2px 20px rgba(0,0,0,0.5), 0 0 40px ${color}20`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Fold line shadows across each curtain panel
    const folds: React.ReactNode[] = []
    for (let side = 0; side < 2; side++) {
      for (let fi = 0; fi < 4; fi++) {
        const foldPos = (fi + 0.5) / 4
        const foldIntensity = 0.04 + (fi % 2) * 0.03
        const translateX = side === 0 ? leftCurtainX : rightCurtainX
        const xPos = side === 0
          ? foldPos * 52 + '%'
          : (100 - foldPos * 52) + '%'
        folds.push(
          <div
            key={`fold-${side}-${fi}`}
            style={{
              position: 'absolute',
              top: 0,
              left: xPos,
              transform: `translateX(${translateX}px)`,
              width: 3,
              height: '100%',
              background: `rgba(0,0,0,${foldIntensity})`,
              filter: 'blur(2px)',
              pointerEvents: 'none',
            }}
          />,
        )
      }
    }

    const edgeShadowOpacity = 1 - curtainOffset
    const edgeShadowWidth = 80 * (1 - curtainOffset * 0.8)

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Text behind curtains */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 128px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>

        {folds}

        {/* Left curtain panel */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: leftCurtainX,
            width: '52%',
            height: '100%',
            background: `linear-gradient(90deg,
              ${curtainColor}ee,
              ${curtainColor}f8 30%,
              ${curtainColor}dd 70%,
              ${curtainColor}88 100%
            )`,
            boxShadow: `inset -20px 0 40px rgba(0,0,0,0.3), inset 4px 0 8px rgba(255,200,100,0.05)`,
          }}
        />

        {/* Right curtain panel */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: width * 0.48 + rightCurtainX,
            width: '52%',
            height: '100%',
            background: `linear-gradient(270deg,
              ${curtainColor}ee,
              ${curtainColor}f8 30%,
              ${curtainColor}dd 70%,
              ${curtainColor}88 100%
            )`,
            boxShadow: `inset 20px 0 40px rgba(0,0,0,0.3), inset -4px 0 8px rgba(255,200,100,0.05)`,
          }}
        />

        {/* Center shadow gap as curtains part */}
        {edgeShadowOpacity > 0.05 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: edgeShadowWidth,
              height: '100%',
              background: `linear-gradient(90deg, rgba(0,0,0,${edgeShadowOpacity * 0.4}), transparent 40%, transparent 60%, rgba(0,0,0,${edgeShadowOpacity * 0.4}))`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function CurtainPartComponent(props: MotionGraphicProps<CurtainPartConfig>) {
  ;(globalThis as any).__curtainPartConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-curtain-part',
  title: 'Kinetic Curtain Part',
  description: 'Two theater curtain panels split from center to reveal text — cinematic stage reveal with fold shadows, ambient depth light, and smooth open/close motion',
  tags: ['kinetic', 'typography', 'curtain', 'theater', 'stage', 'reveal', 'cinematic', 'transition', 'dramatic', 'next-up'],
  category: 'captions',
  component: CurtainPartComponent as any,
  defaultConfig: {
    words: ['Next up...', 'Plot twist', 'Coming up', 'Act two'],
    colors: ['#FFE8A0', '#FFF0C0', '#FFD880', '#FFFAEC'],
    bgColor: '#0a0500',
    cycleDuration: 1.3,
    curtainColor: '#6B1515',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['Next up...', 'Plot twist', 'Coming up', 'Act two'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FFE8A0', '#FFF0C0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0500', group: 'Style' },
    { key: 'curtainColor', label: 'Curtain Color', type: 'color', defaultValue: '#6B1515', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
