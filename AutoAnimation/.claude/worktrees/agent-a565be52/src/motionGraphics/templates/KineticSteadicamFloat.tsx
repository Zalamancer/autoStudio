import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SteadicamFloatConfig extends KineticBaseConfig {
  floatAmplitude: number
}

function smoothSin(t: number, freq: number, phase: number): number {
  return Math.sin(t * freq + phase)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Steadicam ambient: very slow organic drift of environment
    const driftX = smoothSin(time, 0.15, 0) * 3
    const driftY = smoothSin(time, 0.11, 1.2) * 2

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          transform: `translate(${driftX}px, ${driftY}px)`,
          overflow: 'hidden',
        }}
      >
        {/* Steadicam floor — subtle depth plane */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '20%',
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* Floating horizon particles — environmental depth */}
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((t, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(t * 100 + smoothSin(time, 0.08 + i * 0.03, i * 1.5) * 8) % 100}%`,
              top: `${(35 + i * 5 + smoothSin(time, 0.06, i * 2) * 4) % 100}%`,
              width: 60 + i * 20,
              height: 1,
              background: `rgba(255,255,255,${0.03 + i * 0.01})`,
              borderRadius: 1,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Vignette — lens edge falloff */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Steadicam gimbal crosshair — faint */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 20,
            height: 20,
            transform: 'translate(-50%, -50%)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Steadicam float: smooth, never jerky — Gaussian ease in/out
    let translateX = 0
    let translateY = 0
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      // Float in from slight right — camera walking approach
      const ease = enterProgress < 0.5 ? 2 * enterProgress * enterProgress : 1 - Math.pow(-2 * enterProgress + 2, 2) / 2
      translateX = (1 - ease) * 25
      translateY = (1 - ease) * -8
      opacity = ease
      scale = 0.96 + ease * 0.04
    } else if (phase === 'hold') {
      // Living float — steadicam never locks perfectly still
      const amp = 2.5
      translateX = smoothSin(t, 0.4, index * 1.3) * amp + smoothSin(t, 0.17, index * 0.7) * amp * 0.4
      translateY = smoothSin(t, 0.3, index * 2.1) * amp * 0.6 + smoothSin(t, 0.23, index * 1.1) * amp * 0.3
      scale = 1 + smoothSin(t, 0.25, index) * 0.006
      opacity = 1
    } else {
      // Float out — camera continues past, subject drifts left
      const ease = Math.pow(exitProgress, 2)
      translateX = -ease * 20
      translateY = ease * 5
      opacity = 1 - exitProgress * 0.85
      scale = 1 - ease * 0.02
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(48px, 13vw, 170px)',
          fontWeight: 300,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 18,
          textTransform: 'uppercase',
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}
      >
        {word}
      </div>
    )
  },
}

function SteadicamFloatComponent(props: MotionGraphicProps<SteadicamFloatConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-steadicam-float',
  title: 'Kinetic Steadicam Float',
  description:
    'Ultra-smooth organic floating motion mimicking a steadicam rig — layered sinusoidal drift, soft entry/exit, and living hold with never-still camera feel',
  tags: ['kinetic', 'typography', 'steadicam', 'float', 'smooth', 'cinematic', 'camera', 'organic'],
  category: 'captions',
  component: SteadicamFloatComponent as any,
  defaultConfig: {
    words: ['SMOOTH', 'GLIDE', 'FLOAT', 'DRIFT'],
    colors: ['#E8E8E8', '#D0D0D0', '#FFFFFF', '#C8C8C8'],
    bgColor: '#111111',
    cycleDuration: 1.8,
    floatAmplitude: 25,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SMOOTH', 'GLIDE', 'FLOAT', 'DRIFT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E8E8E8', '#D0D0D0', '#FFFFFF', '#C8C8C8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    {
      key: 'floatAmplitude',
      label: 'Float Amplitude (px)',
      type: 'number',
      defaultValue: 25,
      min: 5,
      max: 80,
      group: 'Animation',
    },
  ],
})
