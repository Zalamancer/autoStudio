import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface IceMeltRevealConfig extends KineticBaseConfig {
  icicleCount: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Icy shimmer on background
    const shimmer1 = Math.sin(t * 0.6) * 0.5 + 0.5
    const shimmer2 = Math.sin(t * 0.9 + 1.2) * 0.5 + 0.5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${20 + shimmer1 * 60}% ${30 + shimmer2 * 40}%, rgba(140,200,255,0.06), transparent 55%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${70 - shimmer2 * 40}% ${60 + shimmer1 * 20}%, rgba(180,220,255,0.04), transparent 45%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__iceMeltConfig ?? { icicleCount: 18 }
    const icicleCount = cfg.icicleCount ?? 18

    // Ice slab: a rectangular block of ice covering text that melts away top-to-bottom
    let iceSlab_opacity = 0
    let iceSlab_scaleY = 1
    let iceSlab_originY = '0%'
    let textOpacity = 0
    let textBlur = 0
    let drip_progress = 0

    if (phase === 'enter') {
      // Ice melts from top down; text gradually reveals through the thickening water
      const ep = easeOutExpo(enterProgress)
      iceSlab_scaleY = 1 - ep
      iceSlab_opacity = 1 - ep
      iceSlab_originY = '0%'
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.15) / 0.85))
      textBlur = (1 - textOpacity) * 6
      drip_progress = ep
    } else if (phase === 'hold') {
      iceSlab_opacity = 0
      iceSlab_scaleY = 0
      textOpacity = 1
      textBlur = 0
      drip_progress = 1
    } else {
      // Refreeze from top
      iceSlab_scaleY = easeInQuad(exitProgress)
      iceSlab_opacity = iceSlab_scaleY
      iceSlab_originY = '0%'
      textOpacity = 1 - easeInQuad(exitProgress)
      textBlur = easeInQuad(exitProgress) * 5
    }

    // Icicles dripping along top edge
    const icicles: React.ReactNode[] = []
    for (let i = 0; i < icicleCount; i++) {
      const ixNorm = (i + 0.5) / icicleCount
      const ix = ixNorm * width
      const baseH = 8 + rand(i * 41 + index) * 22
      const tipW = 2 + rand(i * 67 + index) * 4
      const dropDelay = rand(i * 53 + index) * 0.4
      const dripPhase = Math.max(0, (drip_progress - dropDelay) / 0.6)
      const icicleH = baseH * Math.min(1, easeOutExpo(Math.min(1, dripPhase * 2)))
      const dropProgress = Math.max(0, (dripPhase - 0.5) / 0.5)
      const dropY = dropProgress * height * 0.5
      const dropAlpha = dropProgress > 0 ? Math.max(0, 1 - dropProgress * 1.5) : 0
      const dropSize = 4 + rand(i * 29 + index) * 4

      icicles.push(
        <React.Fragment key={`ic${i}`}>
          {/* Icicle body */}
          <div
            style={{
              position: 'absolute',
              left: ix - tipW / 2,
              top: 0,
              width: tipW,
              height: icicleH,
              background: `linear-gradient(180deg, rgba(180,220,255,0.65), rgba(140,200,255,0.35) 70%, rgba(100,180,255,0.1))`,
              borderRadius: `0 0 ${tipW / 2}px ${tipW / 2}px`,
              clipPath: `polygon(0 0, 100% 0, ${tipW * 0.5}px ${icicleH}px)`,
            }}
          />
          {/* Water drop falling */}
          {dropAlpha > 0 && (
            <div
              style={{
                position: 'absolute',
                left: ix - dropSize / 2,
                top: icicleH + dropY,
                width: dropSize,
                height: dropSize * 1.3,
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                background: `radial-gradient(ellipse at 40% 35%, rgba(200,230,255,0.8), rgba(140,200,255,${dropAlpha}) 60%, transparent)`,
              }}
            />
          )}
        </React.Fragment>,
      )
    }

    // Melt puddle at bottom
    const puddleAlpha = drip_progress * 0.25
    const puddleW = width * (0.3 + drip_progress * 0.5)

    // Per-character frost glisten during hold
    const chars = word.split('').map((ch, ci) => {
      const glisten = phase === 'hold' ? Math.sin(t * 1.8 + ci * 0.9) * 0.5 + 0.5 : 0
      const charColor = glisten > 0.8 ? '#EAFAFF' : color
      return (
        <span key={ci} style={{ color: charColor, display: 'inline-block' }}>
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Text underneath */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            filter: textBlur > 0 ? `blur(${textBlur}px)` : 'none',
            textShadow: `0 0 15px ${color}50, 0 0 35px rgba(140,200,255,0.2)`,
          }}
        >
          {chars}
        </div>

        {/* Ice slab overlay */}
        {iceSlab_opacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: iceSlab_originY === '0%' ? '50% 0%' : '50% 100%',
              transform: `scaleY(${iceSlab_scaleY})`,
              background: `linear-gradient(180deg, rgba(160,215,255,0.55), rgba(100,180,240,0.35) 60%, rgba(60,150,220,0.15))`,
              opacity: iceSlab_opacity,
            }}
          >
            {/* Ice texture veins */}
            {[...Array(5)].map((_, vi) => (
              <div
                key={vi}
                style={{
                  position: 'absolute',
                  left: `${15 + vi * 17}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: `linear-gradient(180deg, rgba(200,235,255,0.3), rgba(160,210,250,0.12) 50%, transparent)`,
                  transform: `rotate(${(rand(vi * 31 + index) - 0.5) * 5}deg)`,
                }}
              />
            ))}
          </div>
        )}

        {/* Icicles */}
        {icicles}

        {/* Puddle at bottom */}
        {puddleAlpha > 0.01 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: puddleW,
              height: 8,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, rgba(160,210,255,${puddleAlpha}), transparent 70%)`,
            }}
          />
        )}
      </div>
    )
  },
}

function IceMeltRevealComponent(props: MotionGraphicProps<IceMeltRevealConfig>) {
  ;(globalThis as any).__iceMeltConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ice-melt-reveal',
  title: 'Kinetic Ice Melt Reveal',
  description: 'An ice slab melts top-to-bottom revealing text underneath, icicles drip from the upper edge and water pools at the base',
  tags: ['kinetic', 'typography', 'ice', 'melt', 'water', 'frost', 'destruction', 'reveal', 'cold'],
  category: 'captions',
  component: IceMeltRevealComponent as any,
  defaultConfig: {
    words: ['THAW', 'MELT', 'COLD', 'FLOW'],
    colors: ['#C8EAFF', '#A8D8FF', '#E0F4FF', '#B0DCFF'],
    bgColor: '#060e1a',
    cycleDuration: 1.6,
    icicleCount: 18,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['THAW', 'MELT', 'COLD', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8EAFF', '#A8D8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060e1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'icicleCount', label: 'Icicle Count', type: 'number', defaultValue: 18, min: 6, max: 30, group: 'Animation' },
  ],
})
