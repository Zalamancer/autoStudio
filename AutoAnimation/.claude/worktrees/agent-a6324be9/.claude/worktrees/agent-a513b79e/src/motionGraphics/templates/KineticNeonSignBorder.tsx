import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KineticNeonSignBorderConfig extends KineticBaseConfig {
  tubeColor: string
  flickerRate: number
}

// Neon flicker pattern: simulates realistic neon tube startup and idle flicker
function getNeonFlicker(t: number, rate: number, phase: 'startup' | 'idle' | 'shutdown'): number {
  if (phase === 'startup') {
    // Flicker on/off a few times before stabilizing
    if (t < 0.15) return t > 0.05 && t < 0.1 ? 0.8 : 0.1
    if (t < 0.3) return t > 0.2 && t < 0.25 ? 0.9 : 0.15
    if (t < 0.5) return 0.3 + t * 1.2
    return Math.min(1, 0.5 + t)
  }
  if (phase === 'shutdown') {
    if (t > 0.8) return t > 0.85 && t < 0.9 ? 0.4 : 0.05
    if (t > 0.6) return t > 0.65 && t < 0.7 ? 0.6 : 0.2
    return 1 - t * 0.5
  }
  // Idle: occasional random-looking flicker
  const flicker = Math.sin(t * rate * 50) * Math.sin(t * rate * 73) * Math.sin(t * rate * 31)
  return flicker > 0.85 ? 0.6 : 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const time = (frame || 0) / 30

    // Text lights up after border (delayed on enter)
    const textBrightness = phase === 'enter'
      ? enterProgress > 0.6 ? getNeonFlicker((enterProgress - 0.6) / 0.4, 1, 'startup') : 0
      : phase === 'exit'
        ? getNeonFlicker(exitProgress, 1, 'shutdown')
        : getNeonFlicker(holdProgress, 1, 'idle')

    const textOpacity = phase === 'enter'
      ? Math.min(1, Math.max(0, (enterProgress - 0.5) * 3))
      : phase === 'exit'
        ? Math.max(0, 1 - exitProgress * 1.5)
        : 1

    const glowAmount = textBrightness * 20

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: textOpacity * textBrightness,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(32px, 10vw, 120px)',
          fontWeight: 700,
          color,
          textShadow: [
            `0 0 ${glowAmount * 0.5}px ${color}`,
            `0 0 ${glowAmount}px ${color}`,
            `0 0 ${glowAmount * 2}px ${color}60`,
            `0 0 ${glowAmount * 3}px ${color}30`,
          ].join(', '),
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function KineticNeonSignBorderComponent(props: MotionGraphicProps<KineticNeonSignBorderConfig>) {
  const { config, progress, frame, fps, width, height } = props
  const { tubeColor, flickerRate } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const phase = enterProgress < 1 ? 'startup' : exitProgress > 0 ? 'shutdown' : 'idle'
  const phaseProgress = enterProgress < 1 ? enterProgress : exitProgress > 0 ? exitProgress : holdProgress

  const brightness = getNeonFlicker(phaseProgress, flickerRate, phase as any)

  const margin = 24
  const tubeWidth = 3
  const glowSize = brightness * 15

  const borderShadow = [
    `inset 0 0 ${glowSize}px ${tubeColor}`,
    `inset 0 0 ${glowSize * 2}px ${tubeColor}50`,
    `0 0 ${glowSize}px ${tubeColor}`,
    `0 0 ${glowSize * 2}px ${tubeColor}40`,
    `0 0 ${glowSize * 4}px ${tubeColor}20`,
  ].join(', ')

  const borderOpacity = enterProgress < 1
    ? brightness * Math.min(1, enterProgress * 2)
    : exitProgress > 0
      ? brightness * Math.max(0, 1 - exitProgress * 1.2)
      : brightness

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      <KineticBase {...props} animation={animation} />

      {/* Neon tube border */}
      <div
        style={{
          position: 'absolute',
          top: margin,
          left: margin,
          right: margin,
          bottom: margin,
          border: `${tubeWidth}px solid ${tubeColor}`,
          borderRadius: 6,
          boxShadow: borderShadow,
          opacity: borderOpacity,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-sign-border',
  title: 'Kinetic Neon Sign Border',
  description: 'Neon sign-style border with realistic flicker startup, idle glow, and animated text cycling',
  tags: ['kinetic', 'neon', 'sign', 'border', 'overlay', 'flicker'],
  category: 'captions',
  component: KineticNeonSignBorderComponent as any,
  defaultConfig: {
    words: ['OPEN', 'LIVE', 'NEON', 'GLOW'],
    colors: ['#FF69B4', '#FF1493', '#FF69B4', '#FF1493'],
    bgColor: '#0d0d0d',
    cycleDuration: 1.2,
    tubeColor: '#FF69B4',
    flickerRate: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OPEN', 'LIVE', 'NEON', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF69B4', '#FF1493', '#FF69B4', '#FF1493'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'tubeColor', label: 'Tube Color', type: 'color', defaultValue: '#FF69B4', group: 'Neon' },
    { key: 'flickerRate', label: 'Flicker Rate', type: 'number', defaultValue: 1, min: 0.1, max: 3, group: 'Neon' },
  ],
})
