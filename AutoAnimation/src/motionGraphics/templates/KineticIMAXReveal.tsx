import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface IMAXRevealConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle starfield depth — points at different parallax speeds
    const starOffset1 = (time * 2) % 100
    const starOffset2 = (time * 1.3 + 33) % 100

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Deep space black */}
        <div style={{ position: 'absolute', inset: 0, background: '#000005' }} />
        {/* Distant star layer */}
        {[15, 27, 43, 61, 72, 85, 8, 38, 55, 91].map((x, i) => (
          <div
            key={`s1-${i}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${(starOffset1 + i * 11.3) % 100}%`,
              width: 1,
              height: 1,
              borderRadius: '50%',
              background: `rgba(255,255,255,${0.3 + (i % 3) * 0.2})`,
            }}
          />
        ))}
        {/* Near star layer — faster */}
        {[5, 22, 47, 68, 83, 94].map((x, i) => (
          <div
            key={`s2-${i}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${(starOffset2 + i * 17.7) % 100}%`,
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: `rgba(200,220,255,${0.5 + (i % 2) * 0.2})`,
            }}
          />
        ))}
        {/* Central convergence point glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 30% 25% at 50% 50%, rgba(80,100,180,${0.08 + 0.02 * Math.sin(time * 0.8)}) 0%, transparent 100%)`,
          }}
        />
        {/* IMAX aspect ratio letterbox bars — 1.43:1 fills more vertical */}
        {/* No letterbox for IMAX — it IS the full frame. Show subtle scope lines instead */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 2,
            background: 'rgba(255,255,255,0.04)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            background: 'rgba(255,255,255,0.04)',
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 24

    // IMAX: text rushes toward viewer from vanishing point deep in frame
    // Scale goes from tiny (far) to massive (close), then settles
    let opacity = 0
    let scale = 1
    let blurPx = 0

    if (phase === 'enter') {
      // Exponential scale rush — from 0.05 (tiny distant) to 1
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      scale = 0.05 + eased * 0.95
      opacity = Math.min(1, enterProgress * 3)
      // Motion blur during rush
      blurPx = (1 - enterProgress) * 8
    } else if (phase === 'hold') {
      scale = 1
      opacity = 1
      blurPx = 0
      // Imperceptible slow zoom continuing — IMAX never stops moving
      const slowZoom = holdProgress * 0.03
      scale = 1 + slowZoom
    } else {
      // Exit: continue rushing past — scale past 1 and fade
      scale = 1.03 + exitProgress * 0.5
      opacity = 1 - exitProgress
      blurPx = exitProgress * 6
    }

    // Letter spacing compresses as text approaches — starts wide, settles
    const letterSpacingPx =
      phase === 'enter' ? 40 * (1 - enterProgress) + 4 : phase === 'exit' ? 4 - exitProgress * 4 : 4

    return (
      <>
        {/* Atmospheric depth haze — blue shift for deep space depth */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale * 0.98})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 152px)',
            fontWeight: 900,
            color: 'rgba(120,160,255,0.3)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: letterSpacingPx,
            filter: `blur(${blurPx + 8}px)`,
            opacity: opacity * 0.6,
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 152px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: letterSpacingPx,
            filter: `blur(${blurPx}px)`,
            textShadow: `0 0 40px rgba(120,160,255,${opacity * 0.5}), 0 0 80px rgba(80,120,200,${opacity * 0.3})`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function IMAXRevealComponent(props: MotionGraphicProps<IMAXRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-imax-reveal',
  title: 'Kinetic IMAX Reveal',
  description:
    'IMAX-scale reveal: text rushes toward viewer from deep vanishing point with exponential scale, atmospheric depth haze, and crushing letter-spacing',
  tags: ['kinetic', 'typography', 'imax', 'cinema', 'film', 'zoom', 'scale', 'epic', 'depth'],
  category: 'captions',
  component: IMAXRevealComponent as any,
  defaultConfig: {
    words: ['EPIC', 'IMAX', 'SCALE'],
    colors: ['#ffffff', '#e8f0ff', '#ffffff'],
    bgColor: '#000005',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EPIC', 'IMAX', 'SCALE'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#ffffff', '#e8f0ff', '#ffffff'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000005', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
  ],
})
