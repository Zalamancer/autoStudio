import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GymPumpConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const pulse = Math.sin(time * 4) * 0.5 + 0.5
    const glowOpacity = 0.08 + pulse * 0.06

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Red gym energy gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 60%, rgba(220,38,38,${glowOpacity}), transparent 70%)`,
          }}
        />
        {/* Dark vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)',
          }}
        />
        {/* Diagonal stripe pattern */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: `${i * 25 - 10}%`,
              width: '6%',
              height: '100%',
              background: `rgba(255,50,50,${0.02 + pulse * 0.015})`,
              transform: 'skewX(-20deg)',
            }}
          />
        ))}
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
    frame,
    fps,
  }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    let opacity = 1
    let scaleX = 1
    let scaleY = 1
    let translateY = 0

    if (phase === 'enter') {
      // Explode in with overshoot
      const eased = easeOutBack(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      scaleX = 0.3 + eased * 0.7
      scaleY = 0.3 + eased * 0.7
    } else if (phase === 'hold') {
      // Pumping / flexing cycle
      const pumpCycle = holdProgress * 6
      const pumpPhase = pumpCycle % 1

      // Quick expand, slow contract (like a rep)
      let pumpValue: number
      if (pumpPhase < 0.2) {
        // Fast concentric (pump up)
        pumpValue = pumpPhase / 0.2
      } else if (pumpPhase < 0.5) {
        // Hold at top
        pumpValue = 1
      } else {
        // Slow eccentric (release)
        pumpValue = 1 - (pumpPhase - 0.5) / 0.5
      }

      // Lateral spread like muscle flexing
      scaleX = 1 + pumpValue * 0.2
      scaleY = 1 - pumpValue * 0.08
      translateY = pumpValue * -3

      opacity = 1
    } else {
      // Exit: power slam out
      opacity = 1 - exitProgress * exitProgress
      scaleX = 1 + exitProgress * 0.4
      scaleY = 1 - exitProgress * 0.3
    }

    const glowIntensity = phase === 'hold' ? 12 + scaleX * 10 : 8

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY}) translateY(${translateY}px)`,
          transformOrigin: 'center center',
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            textShadow: `
              0 0 ${glowIntensity}px ${color}80,
              0 0 ${glowIntensity * 2}px rgba(220,38,38,0.3),
              0 4px 12px rgba(0,0,0,0.7)
            `,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Power line under text */}
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '10%',
            right: '10%',
            height: '3px',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            opacity: phase === 'hold' ? scaleX - 0.9 : 0,
            borderRadius: '2px',
          }}
        />
      </div>
    )
  },
}

function GymPumpComponent(props: MotionGraphicProps<GymPumpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gym-pump',
  title: 'Gym Pump',
  description:
    'Text pumps and flexes with muscle energy. Quick expansion and slow contraction mimics a gym rep, with red power glow and diagonal stripes.',
  tags: ['kinetic', 'gym', 'pump', 'fitness', 'muscle', 'flex', 'energy', 'workout'],
  category: 'captions',
  component: GymPumpComponent as any,
  defaultConfig: {
    words: ['PUMP', 'FLEX', 'GRIND', 'BEAST'],
    colors: ['#FF3333', '#FF5500', '#FF2200', '#FF4444'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PUMP', 'FLEX', 'GRIND', 'BEAST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3333', '#FF5500', '#FF2200', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
