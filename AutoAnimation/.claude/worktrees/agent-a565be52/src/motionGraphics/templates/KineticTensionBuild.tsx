import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TensionBuildConfig extends KineticBaseConfig {
  buildColor: string
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Tension crescendo: 4-second build cycle
    const buildFreq = 0.25
    const buildPhase = (time * buildFreq) % 1
    const tension = easeInQuart(buildPhase)

    // Rapid vibration that intensifies
    const vibFreq = 8 + tension * 40
    const vib = Math.abs(Math.sin(time * vibFreq * Math.PI * 2)) * tension

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Building red glow from edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%,
              transparent ${40 - tension * 35}%,
              rgba(255,30,0,${tension * 0.25}) ${70 - tension * 20}%,
              rgba(200,0,0,${tension * 0.4}) 100%)`,
          }}
        />
        {/* Shaking scanlines on high tension */}
        {tension > 0.4 &&
          Array.from({ length: Math.floor(tension * 8) }).map((_, i) => {
            const lineY = (i / Math.floor(tension * 8)) * 100
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${lineY}%`,
                  height: 1,
                  background: `rgba(255,60,0,${tension * 0.15})`,
                  transform: `translateX(${vib * (i % 2 === 0 ? 1 : -1) * 10}px)`,
                }}
              />
            )
          })}
        {/* Compression rings — tightening on build */}
        {[0, 1, 2].map((i) => {
          const ringSize = Math.min(width, height) * (0.9 - i * 0.15 - tension * 0.25)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: Math.max(10, ringSize),
                height: Math.max(10, ringSize),
                borderRadius: '50%',
                border: `${1 + tension * 2}px solid rgba(255,40,0,${tension * (0.3 - i * 0.08)})`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
        {/* Flash at peak */}
        {buildPhase > 0.9 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(255,80,0,${((buildPhase - 0.9) / 0.1) * 0.3})`,
            }}
          />
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    const buildFreq = 0.25
    const buildPhase = (time * buildFreq) % 1
    const tension = easeInQuart(buildPhase)
    const vibFreq = 8 + tension * 40
    const vib = Math.sin(time * vibFreq * Math.PI * 2) * tension * 6

    let opacity = 1
    let scale = 1
    let translateX = 0
    let blur = 0

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      opacity = eased
      scale = 0.8 + 0.2 * eased
    } else if (phase === 'hold') {
      // Tension build: compression + shake
      scale = 1 - tension * 0.05 + buildPhase * 0.03
      translateX = vib
      blur = tension > 0.7 ? (tension - 0.7) * 3 : 0
      // Peak flash scale
      if (buildPhase > 0.95) {
        scale = 1 + ((buildPhase - 0.95) / 0.05) * 0.3
      }
    } else {
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(48px, 12vw, 160px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: `${Math.max(0, 0.08 - tension * 0.06)}em`,
          textShadow: `
            0 0 ${10 + tension * 40}px rgba(255,60,0,${tension * 0.8}),
            0 4px 20px rgba(0,0,0,0.8)
          `,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function TensionBuildComponent(props: MotionGraphicProps<TensionBuildConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tension-build',
  title: 'Kinetic Tension Build',
  description:
    'Crescendo tension build: text compresses and shakes with increasing frequency as energy builds toward a peak. Red vignette tightens from edges. Perfect for drop intro.',
  tags: ['kinetic', 'music', 'build', 'tension', 'crescendo', 'drop', 'shake', 'pressure', 'edm'],
  category: 'captions',
  component: TensionBuildComponent as any,
  defaultConfig: {
    words: ['BUILD', 'RISE', 'PEAK', 'NOW'],
    colors: ['#FF6030', '#FF4020', '#FF8040', '#FF3010'],
    bgColor: '#080100',
    cycleDuration: 1.2,
    buildColor: '#FF4020',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BUILD', 'RISE', 'PEAK', 'NOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6030', '#FF4020', '#FF8040', '#FF3010'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080100', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'buildColor', label: 'Build Color', type: 'color', defaultValue: '#FF4020', group: 'Animation' },
  ],
})
