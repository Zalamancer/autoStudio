import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WallCrumbleConfig extends KineticBaseConfig {
  rows: number
  cols: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const BRICK_COLORS = ['rgba(165,110,80,', 'rgba(145,92,62,', 'rgba(180,125,90,', 'rgba(155,105,72,']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const cfg = (globalThis as any).__wallCrumbleConfig ?? { rows: 8, cols: 16 }
    const rows = cfg.rows ?? 8
    const cols = cfg.cols ?? 16

    const brickW = width / cols
    const brickH = height / rows

    let textOpacity = 0
    let textScale = 1

    if (phase === 'enter') {
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.2) / 0.8))
      textScale = 0.92 + textOpacity * 0.08
    } else if (phase === 'hold') {
      textOpacity = 1
      textScale = 1
    } else {
      textOpacity = 1 - exitProgress
      textScale = 1
    }

    const bricks: React.ReactNode[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const si = r * cols + c + index * 73
        // Each brick has an individual delay based on distance from bottom-center
        const distFromBottom = (rows - r) / rows
        const distFromCenter = Math.abs(c / cols - 0.5) * 0.5
        const delay = distFromBottom * 0.4 + distFromCenter * 0.2 + rand(si * 31) * 0.15

        let brickProgress = 0
        let fallY = 0
        let fallRotate = 0
        let brickOpacity = 1

        if (phase === 'enter') {
          // Bricks fall away downward staggered from bottom up
          const bp = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))
          brickProgress = easeInCubic(bp)
          fallY = brickProgress * (height * 0.5 + brickH * 2)
          fallRotate = (rand(si * 53) - 0.5) * 45 * brickProgress
          brickOpacity = 1 - brickProgress
        } else if (phase === 'hold') {
          brickOpacity = 0
        } else {
          // Bricks reform from top
          const bp = Math.max(0, Math.min(1, (exitProgress - (1 - distFromBottom) * 0.4) / 0.55))
          brickProgress = easeOutExpo(bp)
          fallY = (1 - brickProgress) * (-height * 0.3 - brickH)
          fallRotate = (rand(si * 53) - 0.5) * 30 * (1 - brickProgress)
          brickOpacity = brickProgress
        }

        if (brickOpacity < 0.01) continue

        const brickColorBase = BRICK_COLORS[(r * cols + c) % BRICK_COLORS.length]
        const lightness = 0.7 + rand(si * 19) * 0.3
        const mortarAlpha = 0.35

        const bx = c * brickW + (r % 2 === 0 ? 0 : brickW * 0.5)
        const by = r * brickH

        bricks.push(
          <div
            key={`wc-${r}_${c}`}
            style={{
              position: 'absolute',
              left: bx,
              top: by + fallY,
              width: brickW - 2,
              height: brickH - 2,
              transform: `rotate(${fallRotate}deg)`,
              background: `${brickColorBase}${lightness})`,
              boxShadow: `inset -2px -2px 4px rgba(0,0,0,0.3), inset 1px 1px 3px rgba(255,255,255,0.1)`,
              borderRadius: 1,
              opacity: brickOpacity,
              overflow: 'hidden',
            }}
          >
            {/* Mortar line effect */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: `1px solid rgba(100,80,60,${mortarAlpha})`,
              }}
            />
          </div>,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Text revealed underneath bricks */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            fontFamily: "'Impact', 'Arial Narrow', sans-serif",
            fontSize: 'clamp(42px, 12vw, 155px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            textShadow: `3px 3px 0px rgba(0,0,0,0.4), 0 0 20px ${color}30`,
          }}
        >
          {word}
        </div>

        {/* Brick wall on top */}
        {bricks}

        {/* Dust/debris at base during crumble */}
        {phase === 'enter' && enterProgress > 0.1 && enterProgress < 0.85 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: height * 0.15,
              background: `linear-gradient(0deg, rgba(140,100,70,${0.3 * enterProgress}), transparent)`,
              filter: 'blur(8px)',
            }}
          />
        )}
      </div>
    )
  },
}

function WallCrumbleComponent(props: MotionGraphicProps<WallCrumbleConfig>) {
  ;(globalThis as any).__wallCrumbleConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wall-crumble',
  title: 'Kinetic Wall Crumble',
  description:
    'A brick wall crumbles and falls away from bottom to top revealing the word underneath, then rebuilds itself',
  tags: ['kinetic', 'typography', 'wall', 'brick', 'crumble', 'destruction', 'reveal', 'construction'],
  category: 'captions',
  component: WallCrumbleComponent as any,
  defaultConfig: {
    words: ['DEMO', 'BUILD', 'BREAK', 'RISE'],
    colors: ['#FFE0A0', '#FFD080', '#FFC860', '#FFEC90'],
    bgColor: '#1a1008',
    cycleDuration: 1.6,
    rows: 8,
    cols: 16,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DEMO', 'BUILD', 'BREAK', 'RISE'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFE0A0', '#FFD080'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1008', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    { key: 'rows', label: 'Brick Rows', type: 'number', defaultValue: 8, min: 4, max: 14, group: 'Animation' },
    { key: 'cols', label: 'Brick Columns', type: 'number', defaultValue: 16, min: 6, max: 24, group: 'Animation' },
  ],
})
