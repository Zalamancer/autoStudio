import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TectonicShiftConfig extends KineticBaseConfig {
  faultColor: string
}

function easeInQuad(t: number): number {
  return t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Deterministic pseudo-random [0,1]
function rand(s: number): number {
  const x = Math.sin(s * 271.3 + 178.9) * 39847.6
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Tectonic plate boundary — two contrasting rock strata
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Upper plate: lighter sedimentary rock */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, ${bgColor} 0%, rgba(80,65,50,0.35) 100%)`,
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 48%, 102% 52%, 98% 53%, 100% 55%, 0% 55%)',
          }}
        />
        {/* Lower plate: darker mantle-toned rock */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(0deg, rgba(30,20,15,0.6) 0%, transparent 60%)`,
          }}
        />
        {/* Horizontal stratification lines — geological layers */}
        {Array.from({ length: 7 }, (_, i) => {
          const y = height * (0.1 + i * 0.115)
          const opacity = 0.025 + rand(i * 31) * 0.02
          const oscillate = Math.sin(t * 0.3 + i * 0.5) * 2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: y + oscillate,
                height: 1,
                background: `rgba(180,160,120,${opacity})`,
              }}
            />
          )
        })}
        {/* Central pressure glow — heat from compression zone */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleY(0.3)`,
            width: '80%',
            height: '200%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(200,120,40,${0.04 + Math.sin(t * 1.5) * 0.02}), transparent 55%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const t = (frame ?? 0) / 30
    const seed = index * 113 + 59

    // Split the word across a horizontal fault line.
    // Upper half of each character comes from above (slides down).
    // Lower half comes from below (slides up).
    // On collision they lock together — the tectonic collision creates the word.

    let upperShift = 0 // how far top-half has slid down (positive = toward center)
    let lowerShift = 0 // how far bottom-half has slid up (negative = toward center)
    let lockShake = 0 // micro-tremor when plates lock
    let overallOpacity = 1
    let faultGlow = 0

    if (phase === 'enter') {
      // Plates start far apart and slam together
      const collide = easeOutBack(Math.min(1, enterProgress * 1.1))
      upperShift = 1 - collide // upper comes from far above (1 = starting offset)
      lowerShift = 1 - collide // lower comes from far below
      faultGlow = Math.max(0, collide - 0.7) / 0.3 // glow at collision point

      // Impact tremor when collide > 0.85
      if (collide > 0.85) {
        const impactT = (collide - 0.85) / 0.15
        lockShake = Math.sin(impactT * 28) * (1 - impactT) * 4
      }
    } else if (phase === 'hold') {
      upperShift = 0
      lowerShift = 0
      faultGlow = 0.3 + Math.sin(t * 2.1 + index * 0.7) * 0.15
      // Micro-seismic creep: very slow lateral drift at the fault
      lockShake = Math.sin(t * 4.5 + seed * 0.3) * 1.0
    } else {
      // Exit: reverse — plates pull apart (rifting / divergent boundary)
      const ep = easeInQuad(exitProgress)
      upperShift = ep * 0.7
      lowerShift = ep * 0.7
      faultGlow = (1 - ep) * 0.2
      overallOpacity = 1 - easeInQuad(Math.max(0, exitProgress - 0.5) * 2)
    }

    // Max travel distance in pixels — plates come from 50% of the canvas height away
    const maxTravel = height * 0.38

    const upperY = -upperShift * maxTravel // moves downward from above (negative = up)
    const lowerY = lowerShift * maxTravel // moves upward from below (positive = down)

    // Fault crack line style — reddish-orange compression heat
    const faultLineColor = `rgba(220,110,30,${faultGlow})`
    const faultShadow = faultGlow > 0.05 ? `0 0 ${8 + faultGlow * 20}px rgba(220,110,30,${faultGlow * 0.6})` : 'none'

    const textStyle = {
      fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
      fontSize: 'clamp(44px, 11vw, 150px)',
      fontWeight: 900,
      letterSpacing: '0.04em',
      color,
      whiteSpace: 'nowrap' as const,
      textTransform: 'uppercase' as const,
    }

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: overallOpacity }}>
        {/* Upper tectonic plate — top half of text, slides down */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)`,
            transform: `translateY(${upperY.toFixed(2)}px) translateX(${lockShake.toFixed(2)}px)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              ...textStyle,
              // Upper plate gets a slight cooling gradient (lighter on top)
              WebkitTextFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              backgroundImage: `linear-gradient(180deg, ${color}ee 0%, ${color} 50%)`,
              textShadow: `0 -2px 4px rgba(0,0,0,0.4), 1px 0 0 rgba(0,0,0,0.2)`,
            }}
          >
            {word}
          </div>
        </div>

        {/* Lower tectonic plate — bottom half of text, slides up */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)`,
            transform: `translateY(${-lowerY.toFixed(2)}px) translateX(${-lockShake.toFixed(2)}px)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              ...textStyle,
              // Lower plate gets a warming gradient (deeper/hotter at bottom)
              WebkitTextFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              backgroundImage: `linear-gradient(180deg, ${color} 50%, ${color}bb 100%)`,
              textShadow: `0 2px 4px rgba(0,0,0,0.5), 1px 0 0 rgba(0,0,0,0.2)`,
            }}
          >
            {word}
          </div>
        </div>

        {/* Fault line — the compression seam between the two plates */}
        {faultGlow > 0.02 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: width * 0.1,
              right: width * 0.1,
              height: Math.max(1, faultGlow * 3),
              background: faultLineColor,
              transform: 'translateY(-50%)',
              borderRadius: 2,
              boxShadow: faultShadow,
              // Jagged edge simulation: clip with a slight irregular shape
              clipPath: `polygon(
                0% 20%, 8% 0%, 20% 40%, 35% 5%, 50% 45%, 65% 0%, 80% 35%, 92% 5%, 100% 30%,
                100% 80%, 92% 100%, 80% 60%, 65% 95%, 50% 55%, 35% 100%, 20% 65%, 8% 90%, 0% 70%
              )`,
            }}
          />
        )}

        {/* Debris particles at fault — tiny rock fragments during collision */}
        {phase === 'enter' && faultGlow > 0.3 && (
          <>
            {Array.from({ length: 6 }, (_, i) => {
              const px = width * (0.2 + rand(seed + i * 37) * 0.6)
              const py = height / 2 + (rand(seed + i * 41) - 0.5) * 20
              const sz = 1.5 + rand(seed + i * 53) * 3
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: px,
                    top: py,
                    width: sz,
                    height: sz,
                    borderRadius: '20%',
                    background: color,
                    opacity: faultGlow * (0.3 + rand(seed + i * 61) * 0.4),
                    transform: `rotate(${rand(seed + i * 71) * 360}deg)`,
                  }}
                />
              )
            })}
          </>
        )}
      </div>
    )
  },
}

function TectonicShiftComponent(props: MotionGraphicProps<TectonicShiftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tectonic-shift',
  title: 'Tectonic Shift',
  description:
    'Text split into upper and lower tectonic plates that slam together like a continental collision — the two halves slide in from opposite directions and lock along a glowing compression fault line. On exit, the plates rift apart.',
  tags: [
    'kinetic',
    'typography',
    'tectonic',
    'geology',
    'collision',
    'fault',
    'plates',
    'impact',
    'split',
    'earthquake',
  ],
  category: 'captions',
  component: TectonicShiftComponent as any,
  defaultConfig: {
    words: ['FORCE', 'SHIFT', 'BREAK', 'PRESS'],
    colors: ['#D4C4A0', '#C8B890', '#E0D0B0', '#B8A880'],
    bgColor: '#18140C',
    cycleDuration: 1.6,
    faultColor: '#DC6E1E',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FORCE', 'SHIFT', 'BREAK', 'PRESS'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#D4C4A0', '#C8B890', '#E0D0B0', '#B8A880'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#18140C', group: 'Style' },
    { key: 'faultColor', label: 'Fault Line Color', type: 'color', defaultValue: '#DC6E1E', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.6,
      max: 5,
      group: 'Timing',
    },
  ],
})
