import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ColorPencilConfig extends KineticBaseConfig {
  sketchLines: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.2
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

// Deterministic pseudo-random [0, 1)
function h(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Build a set of sketch underlines as divs
function SketchLines({
  color,
  progress,
  seed,
  width,
  height,
}: {
  color: string
  progress: number
  seed: number
  width: number
  height: number
}): React.ReactNode[] {
  const lines: React.ReactNode[] = []
  const count = 8
  const baseY = height * 0.62 // underline zone

  for (let i = 0; i < count; i++) {
    const lineProgress = Math.max(0, Math.min(1, (progress - i * 0.08) / (1 - i * 0.05)))
    if (lineProgress <= 0) continue

    // Slightly wobbly line via transform skew + offset
    const offsetY = (h(seed + i * 7) - 0.5) * 8
    const thickness = 1.5 + h(seed + i * 11) * 2
    const startX = h(seed + i * 3) * 0.1 * width
    const lineW = lineProgress * (width * (0.85 + h(seed + i * 5) * 0.15))
    const skew = (h(seed + i * 13) - 0.5) * 3
    const alpha = 0.35 + h(seed + i * 17) * 0.3

    lines.push(
      <div
        key={`sketch-${i}`}
        style={{
          position: 'absolute',
          left: startX,
          top: baseY + offsetY,
          width: lineW,
          height: thickness,
          background: color,
          opacity: alpha * lineProgress,
          transform: `skewX(${skew}deg)`,
          borderRadius: thickness / 2,
        }}
      />,
    )
  }
  return lines
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Sketch paper — fine tooth texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.8' numOctaves='2' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
            backgroundSize: '160px 160px',
            opacity: 0.06,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
        {/* Faint ruled lines — sketch pad feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(0,0,0,0.03) 32px)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame,
    width,
    height,
  }: WordRenderProps) => {
    const t = (frame ?? 0) / 30
    const W = width ?? 400
    const H = height ?? 300
    const seed = index * 43 + 7

    let textOpacity = 0
    let scale = 1
    let translateX = 0
    let translateY = 0
    let rotate = 0
    let sketchProgress = 0 // how drawn-in the sketch lines are
    let waxGlowOpacity = 0 // waxy sheen on the text
    let blur = 0

    if (phase === 'enter') {
      // Text scribbles in: slides from left, slightly tilted, with sketch lines growing
      const ep = easeOutBack(Math.min(1, enterProgress * 1.08))
      const epSmooth = easeOutCubic(enterProgress)

      translateX = (1 - easeOutCubic(enterProgress)) * -(W * 0.12)
      translateY = (1 - ep) * 18
      rotate = (1 - epSmooth) * (index % 2 === 0 ? -8 : 6)
      scale = 0.88 + ep * 0.12
      textOpacity = Math.min(1, enterProgress * 2.2)
      sketchProgress = epSmooth
      waxGlowOpacity = 0
      blur = Math.max(0, 1 - enterProgress * 2) * 3
    } else if (phase === 'hold') {
      textOpacity = 1
      scale = 1 + Math.sin(holdProgress * Math.PI * 2.2) * 0.008
      rotate = Math.sin(holdProgress * Math.PI * 1.8) * 1.0
      sketchProgress = 1
      // Wax sheen breathes — pencil wax catches light
      waxGlowOpacity = 0.18 + Math.sin(holdProgress * Math.PI * 2.5) * 0.1
      translateY = Math.sin(holdProgress * Math.PI * 2) * 1.2
    } else {
      // Exit: erases to the right — sketch lines retract, text fades
      const ep = easeInQuad(exitProgress)
      textOpacity = 1 - ep
      scale = 1 - ep * 0.08
      translateX = ep * (W * 0.1)
      rotate = ep * (index % 2 === 0 ? 5 : -4)
      sketchProgress = 1 - easeInQuad(exitProgress)
      waxGlowOpacity = 0
      blur = ep * 4
    }

    // Wax pencil texture on text — layered background gradients
    // Simulates waxy color-pencil grain by overlapping diagonals
    const waxAngle1 = 45 + Math.sin(t * 0.4) * 5
    const waxAngle2 = -45 + Math.cos(t * 0.35) * 5
    const waxPattern = [
      `repeating-linear-gradient(${waxAngle1}deg, ${color} 0px, ${color} 0.8px, transparent 0.8px, transparent 3.5px)`,
      `repeating-linear-gradient(${waxAngle2}deg, ${color}88 0px, ${color}88 0.5px, transparent 0.5px, transparent 4px)`,
    ].join(', ')

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Sketch underlines */}
        <div
          style={{
            position: 'absolute',
            left: '7%',
            right: '7%',
            top: 0,
            bottom: 0,
            opacity: textOpacity,
            transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
          }}
        >
          {SketchLines({ color, progress: sketchProgress, seed, width: W * 0.86, height: H })}
        </div>

        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
            opacity: textOpacity,
            filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          }}
        >
          <span
            style={{
              display: 'block',
              fontFamily: "'Georgia', 'Times New Roman', 'Palatino', serif",
              fontSize: 'clamp(38px, 12vw, 150px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              // Color pencil wax texture as text fill — diagonal hatching
              backgroundImage: waxPattern,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              // Show base color as fallback; wax pattern over it
              textShadow: `
                1px 1px 0px ${color}55,
                -1px -1px 0px ${color}33,
                0 0 ${4 + waxGlowOpacity * 20}px ${color}${Math.round(waxGlowOpacity * 255)
                  .toString(16)
                  .padStart(2, '0')}
              `,
            }}
          >
            {word}
          </span>

          {/* Wax sheen overlay — glossy pencil highlight */}
          {waxGlowOpacity > 0.02 && (
            <div
              style={{
                position: 'absolute',
                inset: '-2px 0',
                backgroundImage: `linear-gradient(${115 + Math.sin(t * 0.5) * 20}deg, transparent 30%, rgba(255,255,255,${waxGlowOpacity}) 50%, transparent 70%)`,
                mixBlendMode: 'screen',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Quick crosshatch burst on enter impact */}
        {phase === 'enter' && enterProgress > 0.35 && enterProgress < 0.75 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '90%',
              height: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundImage: `
                repeating-linear-gradient(45deg, ${color}15 0px, ${color}15 1px, transparent 1px, transparent 8px),
                repeating-linear-gradient(-45deg, ${color}10 0px, ${color}10 1px, transparent 1px, transparent 8px)
              `,
              opacity: Math.max(0, 1 - Math.abs(enterProgress - 0.55) / 0.2),
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function ColorPencilComponent(props: MotionGraphicProps<ColorPencilConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-color-pencil',
  title: 'Color Pencil',
  description:
    'Text scribbles in from the left with a slight tilt and crosshatch flash, filled with diagonal waxy color-pencil hatching. Sketch underlines grow in with staggered wobbly strokes. Hold: wax sheen breathes across the text. Exit: erases right.',
  tags: ['kinetic', 'typography', 'pencil', 'sketch', 'handcrafted', 'texture', 'wax', 'draw', 'artsy', 'tactile'],
  category: 'captions',
  component: ColorPencilComponent as any,
  defaultConfig: {
    words: ['SKETCH', 'DRAW', 'MARK', 'CRAFT'],
    colors: ['#E83A5A', '#3A7BDE', '#2ECC71', '#F39C12'],
    bgColor: '#FAFAF5',
    cycleDuration: 1.4,
    sketchLines: 8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SKETCH', 'DRAW', 'MARK', 'CRAFT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E83A5A', '#3A7BDE', '#2ECC71', '#F39C12'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAF5', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.4,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'sketchLines',
      label: 'Sketch Lines',
      type: 'number',
      defaultValue: 8,
      min: 3,
      max: 16,
      group: 'Animation',
    },
  ],
})
