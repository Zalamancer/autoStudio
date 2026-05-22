import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Music Genre: Drill / Trap — ultra-condensed bold, street grime, hard cuts, cold color
// Animation: text drops vertically like a guillotine then slides out horizontal — trap hi-hat stutter

interface DrillCondensedConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Dark concrete textured background with subtle surveillance-camera vignette
    const hatchLines = Array.from({ length: 8 }, (_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${i * 14}%`,
          height: 1,
          background: 'rgba(255,255,255,0.02)',
        }}
      />
    ))

    // Beat-synced flash at 0, 0.25, 0.5, 0.75 of second
    const beat = (time * 4) % 1
    const flashOpacity = beat < 0.05 ? (1 - beat / 0.05) * 0.06 : 0

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#0a0a0a',
        }}
      >
        {hatchLines}
        {/* Corner surveillance timestamp */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            left: '4%',
            fontFamily: 'monospace',
            fontSize: 10,
            color: 'rgba(0,255,0,0.3)',
            letterSpacing: 1,
          }}
        >
          REC ● {String(Math.floor(time / 60)).padStart(2, '0')}:{String(Math.floor(time) % 60).padStart(2, '0')}
        </div>
        {/* Beat flash */}
        <div style={{ position: 'absolute', inset: 0, background: `rgba(255,255,255,${flashOpacity})` }} />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.7) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Guillotine drop: slam in from above at full speed, hard stop
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

    let opacity = 0
    let translateY = 0
    let translateX = 0
    let scaleY = 1

    if (phase === 'enter') {
      const e = easeOutQuart(enterProgress)
      opacity = Math.min(enterProgress * 8, 1)
      translateY = (1 - e) * -120 // drops 120px
      scaleY = 0.7 + e * 0.3 // squash on impact
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle tremor — 808 bass rumble
      translateY = Math.sin(Date.now() * 0.04) * 0.8
    } else {
      // Hard cut slide right — like a trap edit
      opacity = exitProgress < 0.3 ? 1 : Math.max(0, 1 - (exitProgress - 0.3) / 0.2)
      translateX = exitProgress * 80
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          opacity,
          fontFamily: "'Arial Narrow', 'Impact', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(50px, 16vw, 210px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: -4,
          color,
          whiteSpace: 'nowrap',
          textShadow: `2px 0 0 rgba(0,0,0,0.8), -2px 0 0 rgba(0,0,0,0.8)`,
          // Condensed stretch illusion via transform
          transform: `translate(-50%, -50%) translateY(${translateY}px) translateX(${translateX}px) scaleX(0.6) scaleY(${scaleY})`,
        }}
      >
        {word}
      </div>
    )
  },
}

function DrillCondensedComponent(props: MotionGraphicProps<DrillCondensedConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-drill-condensed',
  title: 'Kinetic Drill Condensed',
  description:
    'Drill/trap visual: ultra-condensed text guillotine-drops then hard-cuts out, surveillance camera overlay',
  tags: ['kinetic', 'typography', 'drill', 'trap', 'condensed', 'street', 'music', 'bold'],
  category: 'captions',
  component: DrillCondensedComponent as any,
  defaultConfig: {
    words: ['COLD', 'GRIP', 'REAL', 'DRILL'],
    colors: ['#ffffff', '#e0e0e0', '#ffffff', '#c0ff00'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['COLD', 'GRIP', 'REAL', 'DRILL'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#ffffff', '#e0e0e0', '#ffffff', '#c0ff00'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.0,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
