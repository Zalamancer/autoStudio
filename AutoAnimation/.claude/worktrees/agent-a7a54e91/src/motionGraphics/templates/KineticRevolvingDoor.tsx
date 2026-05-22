import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RevolvingDoorConfig extends KineticBaseConfig {
  segments: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__revolvingDoorConfig ?? { segments: 4 }
    const segments = Math.max(3, Math.min(6, config.segments ?? 4))

    // The turntable rotates in. On enter: rotates from -90deg to 0. On exit: continues rotating to +90deg.
    let rotateY = 0
    let textOpacity = 0

    if (phase === 'enter') {
      const eased = easeOutBack(enterProgress)
      rotateY = -90 * (1 - eased)
      textOpacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'hold') {
      rotateY = 0
      textOpacity = 1
    } else {
      const eased = easeInQuad(exitProgress)
      rotateY = 90 * eased
      textOpacity = Math.max(0, 1 - exitProgress * 1.5)
    }

    // Revolving door wing panels (visual segments spinning around center axis)
    const segmentAngle = 360 / segments
    const wingElements = []

    // During enter the wings rotate in sync with the text (from -90 offset)
    // During exit they continue past. After hold=1 they're at their "resting" rotation.
    let wingRotation = 0
    if (phase === 'enter') {
      wingRotation = -90 * (1 - easeOutBack(enterProgress))
    } else if (phase === 'exit') {
      wingRotation = 90 * easeInQuad(exitProgress)
    }

    for (let i = 0; i < segments; i++) {
      const baseAngle = i * segmentAngle + wingRotation
      // Wing is a thin vertical panel extending from center
      const wingLength = Math.min(width, height) * 0.48
      const opacity = 0.12 + (i % 2) * 0.08

      wingElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: wingLength,
            height: 2,
            background: `rgba(200,202,210,${opacity})`,
            transformOrigin: 'left center',
            transform: `translateY(-50%) rotate(${baseAngle}deg)`,
          }}
        >
          {/* Wing edge */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: -6,
              width: 2,
              height: 14,
              background: `rgba(180,182,190,${opacity + 0.1})`,
              borderRadius: 1,
            }}
          />
        </div>,
      )
    }

    // Central hub circle
    const hubSize = Math.min(width, height) * 0.08

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          perspective: 800,
        }}
      >
        {/* Wing elements (rotate in 2D to suggest revolving motion) */}
        {wingElements}

        {/* Central hub */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: hubSize,
            height: hubSize,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,202,210,0.25) 0%, rgba(140,142,150,0.1) 100%)',
            border: '1px solid rgba(200,202,210,0.2)',
          }}
        />

        {/* Text rotates in on the turntable plane */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) perspective(800px) rotateY(${rotateY}deg)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            backfaceVisibility: 'hidden',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function RevolvingDoorComponent(props: MotionGraphicProps<RevolvingDoorConfig>) {
  ;(globalThis as any).__revolvingDoorConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-revolving-door',
  title: 'Kinetic Revolving Door',
  description: 'Text rotates in on a 3D turntable axis like a revolving door, with radiating wing panels',
  tags: ['kinetic', 'typography', 'revolving', 'door', 'turntable', 'rotate', '3d', 'reveal', 'mechanical'],
  category: 'captions',
  component: RevolvingDoorComponent as any,
  defaultConfig: {
    words: ['SPIN', 'TURN', 'REVOLVE', 'ROTATE'],
    colors: ['#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B'],
    bgColor: '#0d0d16',
    cycleDuration: 1.7,
    segments: 4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SPIN', 'TURN', 'REVOLVE', 'ROTATE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d16', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.7,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'segments',
      label: 'Door Segments',
      type: 'number',
      defaultValue: 4,
      min: 3,
      max: 6,
      group: 'Animation',
    },
  ],
})
