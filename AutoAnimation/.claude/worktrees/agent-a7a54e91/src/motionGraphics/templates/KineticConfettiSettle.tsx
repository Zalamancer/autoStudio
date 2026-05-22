import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ConfettiSettleConfig extends KineticBaseConfig {
  pieceCount: number
  spinSpeed: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const CONFETTI_COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#A8E6CF', '#FF8B94', '#C9B1FF']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const pieceCount = 60
    const seed = index * 97

    // Phase progress
    let assembleP = 0
    let scatterP = 0

    if (phase === 'enter') {
      assembleP = easeOutBack(Math.min(1, enterProgress))
    } else if (phase === 'hold') {
      assembleP = 1
    } else {
      assembleP = 1
      scatterP = easeInCubic(exitProgress)
    }

    // Text opacity: fades in as pieces converge
    const textOpacity =
      phase === 'enter' ? Math.min(1, (enterProgress - 0.6) / 0.4) : phase === 'hold' ? 1 : 1 - scatterP

    const pieces = []
    for (let i = 0; i < pieceCount; i++) {
      const p = pseudo(seed + i * 13)
      const p2 = pseudo(seed + i * 7 + 1)
      const p3 = pseudo(seed + i * 5 + 2)
      const p4 = pseudo(seed + i * 11 + 3)
      const p5 = pseudo(seed + i * 17 + 4)

      // Start position: scattered above and around
      const startX = (p - 0.5) * width * 1.4
      const startY = -height * 0.8 - p2 * height * 0.6
      // End position: cluster near center (word area)
      const endX = (p3 - 0.5) * width * 0.7
      const endY = (p4 - 0.5) * height * 0.5

      const exitX = (p - 0.5) * width * 1.6
      const exitY = height * 0.9 + p2 * height * 0.5

      const stagger = p5 * 0.4
      const localP = phase === 'enter' ? Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger))) : 1

      const easedLocal = easeOutExpo(localP)

      const currentX =
        phase === 'exit' ? endX + (exitX - endX) * easeInCubic(scatterP) : startX + (endX - startX) * easedLocal

      const currentY =
        phase === 'exit' ? endY + (exitY - endY) * easeInCubic(scatterP) : startY + (endY - startY) * easedLocal

      const pieceColor = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
      const size = 6 + p * 10
      const rotation = p3 * 360 + assembleP * p2 * 720
      const isRect = i % 3 !== 0

      pieces.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: isRect ? size : size * 0.8,
            height: isRect ? size * 0.45 : size * 0.8,
            borderRadius: isRect ? 1 : '50%',
            background: pieceColor,
            transform: `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) rotate(${rotation}deg)`,
            opacity: Math.min(1, localP * 4) * (1 - scatterP * 0.8),
          }}
        />,
      )
    }

    return (
      <>
        {pieces}
        {/* The assembled text revealed beneath the confetti */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, textOpacity),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 900,
              color,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        </div>
      </>
    )
  },
}

function ConfettiSettleComponent(props: MotionGraphicProps<ConfettiSettleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-confetti-settle',
  title: 'Kinetic Confetti Settle',
  description:
    'Colorful confetti pieces rain down and accumulate, settling to reveal the word hidden beneath the celebration.',
  tags: ['kinetic', 'typography', 'confetti', 'scatter', 'settle', 'particles', 'celebration', 'assembly', 'reveal'],
  category: 'captions',
  component: ConfettiSettleComponent as any,
  defaultConfig: {
    words: ['PARTY', 'CELEBRATE', 'WIN', 'JOY'],
    colors: ['#FFFFFF', '#FFE66D', '#FF6B6B', '#4ECDC4'],
    bgColor: '#1A1A2E',
    cycleDuration: 2.0,
    pieceCount: 60,
    spinSpeed: 2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PARTY', 'CELEBRATE', 'WIN', 'JOY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFE66D', '#FF6B6B', '#4ECDC4'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'pieceCount',
      label: 'Piece Count',
      type: 'number',
      defaultValue: 60,
      min: 20,
      max: 120,
      group: 'Animation',
    },
    { key: 'spinSpeed', label: 'Spin Speed', type: 'number', defaultValue: 2, min: 0, max: 5, group: 'Animation' },
  ],
})
