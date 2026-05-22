import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OceanCleanConfig extends KineticBaseConfig {
  waveCount: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, #0a2a3a 60%, #0d3b4f 100%)`,
      }}
    />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    frame = 0,
    width: canvasWidth = 800,
    height: canvasHeight = 600,
  }: WordRenderProps) => {
    let opacity = 1
    let textScale = 1

    if (phase === 'enter') {
      opacity = easeOutCubic(enterProgress)
      textScale = 0.7 + easeOutCubic(enterProgress) * 0.3
    } else if (phase === 'hold') {
      textScale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.015
    } else {
      opacity = 1 - exitProgress * exitProgress
      textScale = 1
    }

    const time = frame * 0.03

    // Wave layers that wash across the screen
    const waveCount = 5
    const waves = Array.from({ length: waveCount }, (_, i) => {
      const baseY = 55 + i * 10
      const waveSpeed = 0.8 + i * 0.3
      const amplitude = 8 + i * 3
      const wavePhase = time * waveSpeed + i * 1.2

      // Wave "clean wash" effect during enter
      const washProgress = phase === 'enter'
        ? easeInOutSine(Math.max(0, Math.min(1, (enterProgress - i * 0.08) / 0.5)))
        : phase === 'exit'
          ? 1 - easeInOutSine(Math.max(0, Math.min(1, (exitProgress - (waveCount - 1 - i) * 0.08) / 0.5)))
          : 1

      const waveY = baseY + Math.sin(wavePhase) * amplitude
      const waveOpacity = phase === 'hold'
        ? 0.08 + i * 0.03 + Math.sin(time * 1.5 + i) * 0.02
        : washProgress * (0.08 + i * 0.03)

      return { y: waveY, opacity: waveOpacity, washProgress }
    })

    // Foam bubbles along waves
    const bubbleCount = 8
    const bubbles = Array.from({ length: bubbleCount }, (_, i) => {
      const bx = ((i / bubbleCount) * 100 + time * 15 + i * 30) % 120 - 10
      const by = 52 + Math.sin(time * 2 + i * 0.8) * 12
      const bSize = 3 + Math.sin(time * 3 + i * 1.5) * 2
      const bOpacity = phase === 'hold'
        ? 0.3 + Math.sin(time * 2.5 + i * 0.9) * 0.2
        : phase === 'enter'
          ? easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)) * 0.4
          : 0.4 * (1 - exitProgress)
      return { x: bx, y: by, size: bSize, opacity: bOpacity }
    })

    // Water sparkles
    const sparkleCount = 6
    const sparkles = Array.from({ length: sparkleCount }, (_, i) => {
      const sx = 15 + (i / sparkleCount) * 70
      const sy = 40 + Math.sin(time + i * 2) * 15
      const sOpacity = phase === 'hold'
        ? (Math.sin(time * 4 + i * 1.1) + 1) / 2 * 0.6
        : phase === 'enter'
          ? easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4)) * 0.4
          : 0.4 * (1 - exitProgress)
      return { x: sx, y: sy, opacity: sOpacity }
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          opacity,
        }}
      >
        {/* Wave layers */}
        {waves.map((wave, i) => (
          <div
            key={`wave-${i}`}
            style={{
              position: 'absolute',
              top: `${wave.y}%`,
              left: '-5%',
              width: '110%',
              height: `${50 - i * 3}%`,
              background: `linear-gradient(180deg, rgba(38,166,154,${wave.opacity}), rgba(0,150,136,${wave.opacity * 0.5}), transparent)`,
              borderRadius: '50% 50% 0 0 / 20px 20px 0 0',
              transform: `scaleX(${wave.washProgress})`,
              transformOrigin: 'left center',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Foam bubbles */}
        {bubbles.map((b, i) => (
          <div
            key={`bubble-${i}`}
            style={{
              position: 'absolute',
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.7)',
              opacity: b.opacity,
              boxShadow: '0 0 4px rgba(255,255,255,0.3)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Water sparkles */}
        {sparkles.map((s, i) => (
          <div
            key={`sparkle-${i}`}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: '6px',
              height: '6px',
              opacity: s.opacity,
              pointerEvents: 'none',
            }}
          >
            <div style={{ position: 'absolute', width: '6px', height: '2px', background: '#B2EBF2', borderRadius: '1px', top: '2px' }} />
            <div style={{ position: 'absolute', width: '2px', height: '6px', background: '#B2EBF2', borderRadius: '1px', left: '2px' }} />
          </div>
        ))}

        {/* Main text - centered */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontFamily: "'Trebuchet MS', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(36px, 10vw, 130px)',
              fontWeight: 900,
              color,
              textShadow: '0 2px 15px rgba(0,150,136,0.5), 0 0 30px rgba(38,166,154,0.2)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function OceanCleanComponent(props: MotionGraphicProps<OceanCleanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ocean-clean',
  title: 'Ocean Clean',
  description:
    'Text with ocean wave clean wash effect. Layered waves sweep across the scene with foam bubbles and water sparkles for a fresh ocean feel.',
  tags: ['kinetic', 'ocean', 'water', 'wave', 'clean', 'eco', 'sea', 'sustainability'],
  category: 'captions',
  component: OceanCleanComponent as any,
  defaultConfig: {
    words: ['OCEAN', 'CLEAN', 'WAVE', 'PURE'],
    colors: ['#80DEEA', '#4DD0E1', '#B2EBF2', '#26C6DA'],
    bgColor: '#0a1a2a',
    cycleDuration: 2,
    waveCount: 5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['OCEAN', 'CLEAN', 'WAVE', 'PURE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#80DEEA', '#4DD0E1', '#B2EBF2', '#26C6DA'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1a2a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'waveCount',
      label: 'Wave Count',
      type: 'number',
      defaultValue: 5,
      min: 3,
      max: 8,
      group: 'Animation',
    },
  ],
})
