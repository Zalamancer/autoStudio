import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlotMachineConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Animated gradient that shifts slowly
    const hueShift = Math.sin(t * 0.5) * 15
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(170deg, ${bgColor} 0%, hsl(${45 + hueShift}, 80%, 12%) 50%, ${bgColor} 100%)`,
        }}
      >
        {/* Chrome trim top */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '8%',
            right: '8%',
            height: 3,
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), rgba(255,255,255,0.6), rgba(255,215,0,0.4), transparent)',
            mixBlendMode: 'screen' as const,
          }}
        />
        {/* Chrome trim bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '8%',
            right: '8%',
            height: 3,
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), rgba(255,255,255,0.6), rgba(255,215,0,0.4), transparent)',
            mixBlendMode: 'screen' as const,
          }}
        />
        {/* Subtle pulsing glow behind the slots */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '20%',
            right: '20%',
            bottom: '30%',
            background: `radial-gradient(ellipse, rgba(255,215,0,${0.05 + Math.sin(t * 3) * 0.03}) 0%, transparent 70%)`,
            mixBlendMode: 'screen' as const,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const letters = word.split('')
    const totalLetters = letters.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(4px, 1vw, 12px)',
        }}
      >
        {letters.map((letter, i) => {
          // Each letter has its own slot container with overflow:hidden
          // Staggered timing per letter
          const staggerOffset = (i / totalLetters) * 0.6
          let yOffset = 0 // percent within the slot — 100 = fully below, 0 = visible, -100 = fully above
          let blur = 0

          if (phase === 'enter') {
            const letterProgress = Math.max(0, Math.min(1, (enterProgress - staggerOffset) / (1 - staggerOffset + 0.01)))
            const eased = easeOutBack(letterProgress)
            // Roll up from below: starts at 120% (below), settles at 0 (centered)
            yOffset = (1 - eased) * 120
            blur = (1 - letterProgress) * 2
          } else if (phase === 'hold') {
            // Subtle oscillation per letter — slot machine "settling" wobble
            const wobblePhase = (i / totalLetters) * Math.PI * 2
            yOffset = Math.sin(holdProgress * Math.PI * 6 + wobblePhase) * 3
          } else {
            // Exit: each letter rolls UP and out of view (concept-driven)
            const letterProgress = Math.max(0, Math.min(1, (exitProgress - staggerOffset * 0.5) / (1 - staggerOffset * 0.5 + 0.01)))
            const eased = easeInBack(letterProgress)
            yOffset = -eased * 130
            blur = letterProgress * 2
          }

          return (
            <div
              key={i}
              style={{
                // THE SLOT: overflow:hidden container per letter
                overflow: 'hidden',
                height: 'clamp(50px, 14vw, 180px)',
                width: 'clamp(36px, 10vw, 130px)',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(20,20,20,0.8) 50%, rgba(0,0,0,0.6) 100%)',
                borderRadius: 6,
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.05)',
                position: 'relative',
              }}
            >
              {/* Inner letter that slides within the slot */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, calc(-50% + ${yOffset}%))`,
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 160px)',
                  fontWeight: 900,
                  color,
                  textShadow: `0 0 12px ${color}44, 0 2px 4px rgba(0,0,0,0.8)`,
                  whiteSpace: 'nowrap',
                  filter: blur > 0 ? `blur(${blur}px)` : undefined,
                  mixBlendMode: 'screen' as const,
                }}
              >
                {letter}
              </div>
              {/* Slot highlight overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.15) 100%)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          )
        })}
      </div>
    )
  },
}

function SlotMachineComponent(props: MotionGraphicProps<SlotMachineConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slot-machine',
  title: 'Kinetic Slot Machine',
  description: 'Each letter rolls up into view through narrow overflow:hidden slots like a slot machine reel, with staggered timing and wobble hold',
  tags: ['kinetic', 'typography', 'slot', 'machine', 'casino', 'reveal', 'contained', 'masked'],
  category: 'captions',
  component: SlotMachineComponent as any,
  defaultConfig: {
    words: ['JACKPOT', 'SPIN', 'WIN', 'LUCKY'],
    colors: ['#FFD700', '#FF4444', '#00FF88', '#FF8C00'],
    bgColor: '#0a0a12',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['JACKPOT', 'SPIN', 'WIN', 'LUCKY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FF4444', '#00FF88', '#FF8C00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
