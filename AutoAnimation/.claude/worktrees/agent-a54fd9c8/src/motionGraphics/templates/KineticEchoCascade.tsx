import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Position Rhythm 3/4 — Echo Cascade
// Each beat triggers a new text echo that slides downward in a waterfall cascade

interface EchoCascadeConfig extends KineticBaseConfig {
  cascadeSteps: number
}

const ECHOES = 5

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Cascade guide lines */}
      {Array.from({ length: ECHOES }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: `${30 + i * 10}%`,
            height: 1,
            background: `rgba(255,255,255,${0.03 - i * 0.005})`,
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    height,
  }: WordRenderProps) => {
    let mainOpacity = 1
    let mainY = 0

    if (phase === 'enter') {
      mainOpacity = Math.min(1, enterProgress * 2.5)
      mainY = (1 - enterProgress) * -height * 0.2
    } else if (phase === 'hold') {
      mainOpacity = 1
      // Slight vertical bob on each beat
      mainY = Math.sin(holdProgress * Math.PI * 4) * 6
    } else {
      mainOpacity = 1 - exitProgress
      mainY = exitProgress * height * 0.15
    }

    // Cascade echoes: each delayed by different Y offset + fade
    const echoElements = Array.from({ length: ECHOES }, (_, i) => {
      const delay = (i + 1) * 0.08 // each echo is later in time
      const echoProgress = Math.max(0, holdProgress - delay)
      const cascadeY = (i + 1) * 36 + Math.sin(echoProgress * Math.PI * 4) * 4
      const echoOpacity = phase === 'hold'
        ? mainOpacity * Math.pow(0.6, i + 1)
        : 0
      const echoScale = 1 - (i + 1) * 0.04 // slightly shrink each step
      return { cascadeY, echoOpacity, echoScale, key: i }
    })

    return (
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, 0)' }}>
        {/* Main text */}
        <div
          style={{
            transform: `translateY(${mainY}px)`,
            opacity: mainOpacity,
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            textShadow: `0 0 30px ${color}60`,
            textAlign: 'center',
          }}
        >
          {word}
        </div>
        {/* Cascading echoes */}
        {echoElements.map(({ cascadeY, echoOpacity, echoScale, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: `translate(-50%, ${cascadeY + mainY * (1 - key * 0.1)}px) scale(${echoScale})`,
              opacity: echoOpacity,
              fontSize: 'clamp(48px, 12vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              filter: `blur(${key * 0.4}px)`,
            }}
          >
            {word}
          </div>
        ))}
      </div>
    )
  },
}

function EchoCascadeComponent(props: MotionGraphicProps<EchoCascadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-echo-cascade',
  title: 'Kinetic Echo Cascade',
  description:
    'Text cascades downward in waterfall echoes — each beat triggers a new copy that slides down, fades, and progressively blurs.',
  tags: ['kinetic', 'position', 'echo', 'cascade', 'waterfall', 'delay', 'rhythm', 'music'],
  category: 'captions',
  component: EchoCascadeComponent as any,
  defaultConfig: {
    words: ['ECHO', 'FALL', 'DOWN'],
    colors: ['#48CAE4', '#0096C7', '#0077B6'],
    bgColor: '#03045E',
    cycleDuration: 1.3,
    cascadeSteps: 5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ECHO', 'FALL', 'DOWN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#48CAE4', '#0096C7', '#0077B6'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#03045E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
    { key: 'cascadeSteps', label: 'Cascade Steps', type: 'number', defaultValue: 5, min: 2, max: 8, group: 'Animation' },
  ],
})
