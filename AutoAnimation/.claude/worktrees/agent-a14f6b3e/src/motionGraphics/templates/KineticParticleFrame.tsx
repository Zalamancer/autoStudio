import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KineticParticleFrameConfig extends KineticBaseConfig {
  particleCount: number
  particleColor: string
}

// Deterministic pseudo-random from seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

// Generate frame positions for particles around a rectangle
function getFramePosition(index: number, total: number, margin: number, w: number, h: number): { x: number; y: number } {
  const perimeter = 2 * (w - margin * 2) + 2 * (h - margin * 2)
  const pos = (index / total) * perimeter
  const topLen = w - margin * 2
  const rightLen = h - margin * 2
  const bottomLen = topLen
  const leftLen = rightLen

  if (pos < topLen) {
    return { x: margin + pos, y: margin }
  } else if (pos < topLen + rightLen) {
    return { x: w - margin, y: margin + (pos - topLen) }
  } else if (pos < topLen + rightLen + bottomLen) {
    return { x: w - margin - (pos - topLen - rightLen), y: h - margin }
  } else {
    return { x: margin, y: h - margin - (pos - topLen - rightLen - bottomLen) }
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const opacity = phase === 'enter'
      ? Math.min(1, enterProgress * 2)
      : phase === 'exit'
        ? 1 - exitProgress
        : 1

    const scale = phase === 'enter'
      ? 0.6 + enterProgress * 0.4
      : phase === 'exit'
        ? 1 - exitProgress * 0.3
        : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(36px, 10vw, 120px)',
          fontWeight: 900,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function KineticParticleFrameComponent(props: MotionGraphicProps<KineticParticleFrameConfig>) {
  const { config, progress, frame, fps, width, height } = props
  const { particleCount, particleColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const margin = 30
  const particleSize = 5
  const timeSeconds = frame / fps

  const particles = []
  for (let i = 0; i < particleCount; i++) {
    const framePos = getFramePosition(i, particleCount, margin, width, height)

    // Random start position (scattered)
    const startX = seededRandom(i * 7 + 1) * width
    const startY = seededRandom(i * 7 + 2) * height

    // Random exit position (scattered)
    const endX = seededRandom(i * 7 + 3) * width
    const endY = seededRandom(i * 7 + 4) * height

    // Brownian motion offset during hold
    const brownianX = holdProgress > 0
      ? Math.sin(timeSeconds * 2.5 + i * 1.7) * 4
      : 0
    const brownianY = holdProgress > 0
      ? Math.cos(timeSeconds * 3.1 + i * 2.3) * 4
      : 0

    // Interpolate position
    const easeIn = enterProgress * enterProgress
    const easeOut = 1 - Math.pow(1 - exitProgress, 3)

    const x = enterProgress < 1
      ? startX + (framePos.x - startX) * easeIn
      : exitProgress > 0
        ? framePos.x + (endX - framePos.x) * easeOut
        : framePos.x + brownianX

    const y = enterProgress < 1
      ? startY + (framePos.y - startY) * easeIn
      : exitProgress > 0
        ? framePos.y + (endY - framePos.y) * easeOut
        : framePos.y + brownianY

    const opacity = enterProgress < 1
      ? Math.min(1, enterProgress * 2)
      : exitProgress > 0
        ? 1 - easeOut
        : 0.7 + Math.sin(timeSeconds * 3 + i) * 0.3

    particles.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x - particleSize / 2,
          top: y - particleSize / 2,
          width: particleSize,
          height: particleSize,
          borderRadius: '50%',
          background: particleColor,
          opacity,
          boxShadow: `0 0 ${particleSize * 2}px ${particleColor}80`,
        }}
      />
    )
  }

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      <KineticBase {...props} animation={animation} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {particles}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-kinetic-particle-frame',
  title: 'Kinetic Particle Frame',
  description: 'Frame of floating particles that converge into a rectangle shape with Brownian drift and text cycling',
  tags: ['kinetic', 'particle', 'frame', 'overlay', 'decoration'],
  category: 'captions',
  component: KineticParticleFrameComponent as any,
  defaultConfig: {
    words: ['STARS', 'DUST', 'GLOW', 'SPARK'],
    colors: ['#FFD700', '#FFA500', '#FF6347', '#FFFF00'],
    bgColor: '#0a0a1a',
    cycleDuration: 1,
    particleCount: 40,
    particleColor: '#FFD700',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STARS', 'DUST', 'GLOW', 'SPARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FFA500', '#FF6347', '#FFFF00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
    { key: 'particleCount', label: 'Particle Count', type: 'number', defaultValue: 40, min: 10, max: 100, group: 'Particles' },
    { key: 'particleColor', label: 'Particle Color', type: 'color', defaultValue: '#FFD700', group: 'Particles' },
  ],
})
