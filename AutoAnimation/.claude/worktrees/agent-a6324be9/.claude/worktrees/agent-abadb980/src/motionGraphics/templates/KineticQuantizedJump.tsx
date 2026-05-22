import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface QuantizedJumpConfig extends KineticBaseConfig {
  gridColor: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Quantize position to grid — snaps to nearest beat subdivision
function quantize(value: number, steps: number): number {
  return Math.floor(value * steps) / steps
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const gridDivs = 8
    const beatFreq = 2.0
    const beatPhase = (time * beatFreq) % 1
    const beat = beatPhase < 0.08 ? beatPhase / 0.08 : Math.pow(1 - (beatPhase - 0.08) / 0.92, 4)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Quantize grid */}
        {Array.from({ length: gridDivs }).map((_, i) => {
          const x = (i / gridDivs) * 100
          const currentDiv = Math.floor(time * beatFreq * gridDivs) % gridDivs
          const isActive = i === currentDiv
          return (
            <div
              key={`v${i}`}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: isActive ? `rgba(255,180,0,${0.3 + beat * 0.5})` : `rgba(255,180,0,0.06)`,
              }}
            />
          )
        })}
        {Array.from({ length: gridDivs / 2 }).map((_, i) => {
          const y = (i / (gridDivs / 2)) * 100
          return (
            <div
              key={`h${i}`}
              style={{
                position: 'absolute',
                top: `${y}%`,
                left: 0,
                right: 0,
                height: 1,
                background: `rgba(255,180,0,0.04)`,
              }}
            />
          )
        })}
        {/* Beat pulse at current division */}
        {Array.from({ length: gridDivs }).map((_, i) => {
          const currentDiv = Math.floor(time * beatFreq * gridDivs) % gridDivs
          if (i !== currentDiv) return null
          return (
            <div
              key={`pulse${i}`}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: (i / gridDivs) * 100 + '%',
                width: `${100 / gridDivs}%`,
                background: `rgba(255,180,0,${beat * 0.1})`,
              }}
            />
          )
        })}
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

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    frame = 0,
    width = 400,
    height = 700,
  }: WordRenderProps) => {
    const time = frame / 30
    const beatFreq = 2.0
    const gridDivs = 6
    let opacity = 1
    let scale = 1
    let translateX = 0
    let translateY = 0

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      opacity = eased
      scale = 0.7 + 0.3 * eased
    } else if (phase === 'hold') {
      // Quantized position jumps — snaps to grid
      const rawX = Math.sin(time * 0.7) * 0.4
      const rawY = Math.sin(time * 0.5 + 1.2) * 0.25
      translateX = quantize(rawX, gridDivs) * width * 0.12
      translateY = quantize(rawY, gridDivs) * height * 0.08
      // Micro-stutter on beat
      const beatPhase = (time * beatFreq) % 1
      const beat = beatPhase < 0.08 ? beatPhase / 0.08 : Math.pow(1 - (beatPhase - 0.08) / 0.92, 4)
      scale = 1 + beat * 0.07
    } else {
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          fontSize: 'clamp(46px, 11.5vw, 155px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          textShadow: `0 0 25px ${color}60, 0 4px 18px rgba(0,0,0,0.8)`,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function QuantizedJumpComponent(props: MotionGraphicProps<QuantizedJumpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-quantized-jump',
  title: 'Kinetic Quantized Jump',
  description:
    'Text position snaps to a musical grid — moves in stepwise jumps like a quantized MIDI sequence. Grid lines highlight the active division on every beat.',
  tags: ['kinetic', 'music', 'quantize', 'grid', 'jump', 'midi', 'staccato', 'stepwise', 'producer'],
  category: 'captions',
  component: QuantizedJumpComponent as any,
  defaultConfig: {
    words: ['SNAP', 'GRID', 'LOCK', 'STEP'],
    colors: ['#FFB800', '#FF9900', '#FFD040', '#FFA000'],
    bgColor: '#060400',
    cycleDuration: 1.0,
    gridColor: '#FFB800',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SNAP', 'GRID', 'LOCK', 'STEP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFB800', '#FF9900', '#FFD040', '#FFA000'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060400', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.0,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'gridColor', label: 'Grid Color', type: 'color', defaultValue: '#FFB800', group: 'Animation' },
  ],
})
