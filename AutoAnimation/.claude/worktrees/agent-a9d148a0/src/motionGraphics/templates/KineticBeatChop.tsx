import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BeatChopConfig extends KineticBaseConfig {
  chopColor: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Beat chop: word slices every beat at 2 Hz
    const chopFreq = 2.0
    const chopPhase = (time * chopFreq) % 1
    const chop = chopPhase < 0.1 ? chopPhase / 0.1 : Math.pow(1 - (chopPhase - 0.1) / 0.9, 5)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Horizontal chop slices flash */}
        {[0, 1, 2, 3].map((i) => {
          const sliceY = (i / 4) * 100
          const delay = i * 0.02
          const sp = Math.max(0, (time * chopFreq - delay) % 1)
          const sChop = sp < 0.1 ? sp / 0.1 : Math.pow(1 - (sp - 0.1) / 0.9, 8)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${sliceY}%`,
                height: 1,
                background: `rgba(255,255,255,${sChop * 0.4})`,
                transform: `scaleX(${sChop})`,
                transformOrigin: i % 2 === 0 ? 'left' : 'right',
              }}
            />
          )
        })}
        {/* Chop flash overlay: alternating vertical bands */}
        {chop > 0.5 &&
          [0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${i * 20}%`,
                width: '10%',
                top: 0,
                bottom: 0,
                background: `rgba(255,255,255,${(chop - 0.5) * 0.08 * (i % 2 ? 1 : 0.5)})`,
              }}
            />
          ))}
        {/* Beat flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,255,255,${chop * 0.05})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 30%, ${bgColor}CC 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    const chopFreq = 2.0
    const chopPhase = (time * chopFreq) % 1
    const chop = chopPhase < 0.1 ? chopPhase / 0.1 : Math.pow(1 - (chopPhase - 0.1) / 0.9, 5)

    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      opacity = eased
      scale = 1.3 - 0.3 * eased
    } else if (phase === 'hold') {
      // Beat chop: scale punch + brief clip distortion
      scale = 1 + chop * 0.1
      opacity = chop > 0.8 ? 0.85 : 1
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(50px, 12.5vw, 168px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textShadow: `
            ${chop * 4}px 0 ${color}80,
            ${-chop * 3}px 0 rgba(0,200,255,${chop * 0.6}),
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

function BeatChopComponent(props: MotionGraphicProps<BeatChopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-beat-chop',
  title: 'Kinetic Beat Chop',
  description:
    'Text gets sliced by sharp beat cuts on every quarter note. Horizontal slice lines flash, chromatic aberration shifts on the chop. Hard-hitting trap/hip-hop energy.',
  tags: ['kinetic', 'music', 'beat', 'chop', 'slice', 'trap', 'hip-hop', 'staccato', 'cut'],
  category: 'captions',
  component: BeatChopComponent as any,
  defaultConfig: {
    words: ['CHOP', 'CUT', 'SLICE', 'DICE'],
    colors: ['#FFFFFF', '#FF4444', '#FFFFFF', '#44AAFF'],
    bgColor: '#050505',
    cycleDuration: 1.0,
    chopColor: '#FFFFFF',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CHOP', 'CUT', 'SLICE', 'DICE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FF4444', '#FFFFFF', '#44AAFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.0,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'chopColor', label: 'Chop Color', type: 'color', defaultValue: '#FFFFFF', group: 'Animation' },
  ],
})
