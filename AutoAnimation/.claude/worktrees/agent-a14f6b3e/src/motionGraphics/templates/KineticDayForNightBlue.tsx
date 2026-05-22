import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DayForNightBlueConfig extends KineticBaseConfig {
  moonlightStrength: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Day-for-night: footage shot in daylight, graded to look like night
    // Technique: underexpose 2 stops, push blue channel, add moonlight source
    // Hitchcock perfected this — "nuit américaine" (French: American Night)

    const moonPulse = 0.3 + Math.sin(time * 0.3) * 0.04
    const cloudDrift = (time * 0.02) % 1.0

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Day-for-night blue color push — everything pushed cool */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(10,20,${80 + Math.sin(time * 0.2) * 10},${moonPulse * 0.8})`,
            pointerEvents: 'none',
          }}
        />
        {/* Moonlight source — top-right overhead */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 72% 12%, rgba(180,210,255,${moonPulse}) 0%, rgba(100,150,220,${moonPulse * 0.3}) 30%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Moon disc */}
        <div
          style={{
            position: 'absolute',
            right: '24%',
            top: '8%',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `rgba(220,235,255,${moonPulse * 1.5})`,
            boxShadow: `0 0 20px rgba(180,210,255,${moonPulse}), 0 0 50px rgba(120,160,220,${moonPulse * 0.5})`,
            pointerEvents: 'none',
          }}
        />
        {/* Cloud wisps — drifting across moon */}
        <div
          style={{
            position: 'absolute',
            right: `${18 + cloudDrift * 30}%`,
            top: '6%',
            width: 60,
            height: 20,
            background: 'rgba(40,60,120,0.4)',
            borderRadius: 10,
            filter: 'blur(6px)',
            pointerEvents: 'none',
          }}
        />
        {/* Underexposed shadow fill — crushed dark */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(0,5,20,0.65) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Nuit américaine blue grade scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(10,30,80,0.02) 5px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Stars — distant point lights */}
        {[
          { x: 10, y: 5 }, { x: 25, y: 12 }, { x: 40, y: 3 }, { x: 55, y: 8 },
          { x: 70, y: 15 }, { x: 85, y: 6 }, { x: 15, y: 20 }, { x: 60, y: 18 },
        ].map((star, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: 1 + (i % 2),
              height: 1 + (i % 2),
              borderRadius: '50%',
              background: `rgba(200,220,255,${0.3 + Math.sin(time * (1.5 + i * 0.3) + i) * 0.2})`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    let opacity = 1
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      const ease = 1 - Math.pow(1 - enterProgress, 2)
      opacity = ease
      translateY = (1 - ease) * 12
      scale = 0.97 + ease * 0.03
    } else if (phase === 'hold') {
      scale = 1 + Math.sin(t * 0.4 + index) * 0.004
      // Moonlight shimmer
      opacity = 0.92 + Math.sin(t * 1.8 + index * 1.3) * 0.08
    } else {
      opacity = 1 - Math.pow(exitProgress, 2)
      translateY = exitProgress * 8
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          filter: 'saturate(0.6) contrast(1.2)',
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 10,
          // Moonlight rim light on text
          textShadow: '0 0 30px rgba(100,150,220,0.5), -2px -2px 15px rgba(180,210,255,0.3), 0 2px 8px rgba(0,0,0,0.8)',
        }}
      >
        {word}
      </div>
    )
  },
}

function DayForNightBlueComponent(props: MotionGraphicProps<DayForNightBlueConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-day-for-night-blue',
  title: 'Kinetic Day For Night Blue',
  description: 'Nuit américaine day-for-night grade — blue channel push, simulated moon with glow and clouds, star field, underexposed shadow crush, and moonlight rim text highlight',
  tags: ['kinetic', 'typography', 'day for night', 'nuit americaine', 'moonlight', 'blue', 'cinematic', 'hitchcock'],
  category: 'captions',
  component: DayForNightBlueComponent as any,
  defaultConfig: {
    words: ['NIGHT', 'MOON', 'SHADOW', 'DARK'],
    colors: ['#B4CCFF', '#C0D4FF', '#B4CCFF', '#A8C0FF'],
    bgColor: '#020814',
    cycleDuration: 1.6,
    moonlightStrength: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NIGHT', 'MOON', 'SHADOW', 'DARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B4CCFF', '#C0D4FF', '#B4CCFF', '#A8C0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020814', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'moonlightStrength', label: 'Moonlight Strength', type: 'number', defaultValue: 80, min: 20, max: 150, group: 'Animation' },
  ],
})
