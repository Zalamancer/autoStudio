import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Genre Beats 2/4 — EDM Buildup
// Classic EDM buildup: tempo accelerates, tension mounts, everything shakes

interface EDMBuildupConfig extends KineticBaseConfig {
  maxShake: number
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const cycleLen = 2.5
    const phase = (t % cycleLen) / cycleLen
    const intensity = easeInQuart(phase)

    // Strobe: increases frequency with buildup
    const strobeFreq = 2 + intensity * 18
    const strobePhase = (t * strobeFreq) % 1
    const strobe = phase > 0.7 && strobePhase < 0.06 ? 0.25 : 0

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Growing radial beams */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(from ${t * 60}deg at 50% 50%,
              transparent 0deg,
              rgba(0,200,255,${intensity * 0.12}) 30deg,
              transparent 60deg,
              rgba(255,0,200,${intensity * 0.1}) 90deg,
              transparent 120deg,
              rgba(0,200,255,${intensity * 0.12}) 150deg,
              transparent 180deg,
              rgba(255,0,200,${intensity * 0.1}) 210deg,
              transparent 240deg,
              rgba(0,200,255,${intensity * 0.12}) 270deg,
              transparent 300deg,
              rgba(255,0,200,${intensity * 0.1}) 330deg,
              transparent 360deg)`,
          }}
        />
        {/* Strobe */}
        <div style={{ position: 'absolute', inset: 0, background: `rgba(255,255,255,${strobe})` }} />
        {/* Tension bars at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${intensity * 40}px`,
            background: `linear-gradient(to top, rgba(0,200,255,0.3), transparent)`,
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
  }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let translateX = 0
    let translateY = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.5 + enterProgress * 0.5
    } else if (phase === 'hold') {
      opacity = 1
      // Buildup: intensity increases with holdProgress
      const intensity = easeInQuart(holdProgress)
      // Scale grows with buildup tension
      scale = 1 + intensity * 0.18
      // Shake increases exponentially
      const shakeAmp = intensity * 12
      translateX = (Math.random() - 0.5) * shakeAmp
      translateY = (Math.random() - 0.5) * shakeAmp
    } else {
      // Drop! Explode outward
      opacity = 1 - exitProgress * exitProgress
      scale = 1.18 + exitProgress * 1.0
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
          opacity,
          fontSize: 'clamp(50px, 13vw, 170px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          textShadow: `
            0 0 30px ${color},
            0 0 60px ${color}80,
            0 0 100px ${color}40
          `,
        }}
      >
        {word}
      </div>
    )
  },
}

function EDMBuildupComponent(props: MotionGraphicProps<EDMBuildupConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-edm-buildup',
  title: 'Kinetic EDM Buildup',
  description:
    'EDM buildup: exponentially accelerating shake, growing scale, spinning conic light beams, and strobe effect. Reaches peak on exit drop.',
  tags: ['kinetic', 'genre', 'edm', 'buildup', 'tension', 'drop', 'electronic', 'music', 'rave'],
  category: 'captions',
  component: EDMBuildupComponent as any,
  defaultConfig: {
    words: ['BUILD', 'RISE', 'DROP'],
    colors: ['#00F5FF', '#FF00CC', '#FFFFFF'],
    bgColor: '#030010',
    cycleDuration: 1.5,
    maxShake: 12,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BUILD', 'RISE', 'DROP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00F5FF', '#FF00CC', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030010', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'maxShake', label: 'Max Shake', type: 'number', defaultValue: 12, min: 2, max: 40, group: 'Animation' },
  ],
})
