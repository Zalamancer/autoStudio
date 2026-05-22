import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KineticGlowBorderConfig extends KineticBaseConfig {
  glowColor: string
  glowIntensity: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps, progress }: BackgroundRenderProps) => {
    // Access glowColor and glowIntensity from the DOM context isn't possible here,
    // so background renders just the base bg. Glow is on the frame overlay.
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const opacity = phase === 'enter'
      ? Math.min(1, enterProgress * 2.5)
      : phase === 'exit'
        ? 1 - exitProgress
        : 1

    const scale = phase === 'enter'
      ? 0.8 + enterProgress * 0.2
      : phase === 'exit'
        ? 1 - exitProgress * 0.2
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
          fontSize: 'clamp(36px, 12vw, 140px)',
          fontWeight: 900,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textShadow: `0 0 20px ${color}40`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function KineticGlowBorderComponent(props: MotionGraphicProps<KineticGlowBorderConfig>) {
  const { config, progress, frame, fps } = props
  const { glowColor, glowIntensity } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.85 ? (progress - 0.15) / 0.7 : progress >= 0.85 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  // Glow builds up on enter, pulses on hold, fades on exit
  const baseGlow = enterProgress < 1
    ? glowIntensity * enterProgress
    : exitProgress > 0
      ? glowIntensity * (1 - exitProgress)
      : glowIntensity

  const pulseGlow = holdProgress > 0
    ? baseGlow * (0.6 + Math.sin(holdProgress * Math.PI * 6) * 0.4)
    : baseGlow

  // Color shift during hold
  const hueShift = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 3) * 15 : 0

  const margin = 20
  const borderWidth = 3

  const glowShadow = [
    `inset 0 0 ${pulseGlow * 10}px ${glowColor}`,
    `inset 0 0 ${pulseGlow * 25}px ${glowColor}60`,
    `0 0 ${pulseGlow * 15}px ${glowColor}`,
    `0 0 ${pulseGlow * 40}px ${glowColor}40`,
    `0 0 ${pulseGlow * 60}px ${glowColor}20`,
  ].join(', ')

  return (
    <div style={{ position: 'relative', width: props.width, height: props.height, overflow: 'hidden' }}>
      <KineticBase {...props} animation={animation} />

      {/* Glow border overlay */}
      <div
        style={{
          position: 'absolute',
          top: margin,
          left: margin,
          right: margin,
          bottom: margin,
          border: `${borderWidth}px solid ${glowColor}`,
          borderRadius: 8,
          boxShadow: glowShadow,
          pointerEvents: 'none',
          filter: `hue-rotate(${hueShift}deg)`,
          opacity: enterProgress < 1 ? enterProgress : exitProgress > 0 ? 1 - exitProgress : 1,
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-kinetic-glow-border',
  title: 'Kinetic Glow Border',
  description: 'Neon glow border frame with pulsing light, color shift, and animated text cycling inside',
  tags: ['kinetic', 'glow', 'border', 'neon', 'overlay'],
  category: 'captions',
  component: KineticGlowBorderComponent as any,
  defaultConfig: {
    words: ['GLOW', 'PULSE', 'NEON', 'SHINE'],
    colors: ['#00FFFF', '#FF00FF', '#00FF88', '#FFFF00'],
    bgColor: '#0a0a1a',
    cycleDuration: 1,
    glowColor: '#00FFFF',
    glowIntensity: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GLOW', 'PULSE', 'NEON', 'SHINE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FF00FF', '#00FF88', '#FFFF00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
    { key: 'glowColor', label: 'Glow Color', type: 'color', defaultValue: '#00FFFF', group: 'Glow' },
    { key: 'glowIntensity', label: 'Glow Intensity', type: 'number', defaultValue: 1, min: 0.1, max: 3, group: 'Glow' },
  ],
})
