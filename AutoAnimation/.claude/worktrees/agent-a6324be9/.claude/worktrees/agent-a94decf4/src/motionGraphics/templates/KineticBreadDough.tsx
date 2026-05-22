import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BreadDoughConfig extends KineticBaseConfig {}

/* --- physics-matched easings --- */

/** Yeast rise: slow organic expansion with deceleration at peak */
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/** Dough collapse: accelerating sag under gravity */
function easeInCubic(t: number): number {
  return t * t * t
}

/** Gentle breathing ease for proofing */
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

/** Deterministic pseudo-random */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Layer 1: Flour dust particles drifting in warm bakery air
    const flourMotes: React.ReactNode[] = []
    for (let i = 0; i < 20; i++) {
      const baseX = width * rand(i * 31 + 7)
      const drift = Math.sin(t * 0.5 + i * 1.3) * 25
      const baseY = height * rand(i * 47 + 13)
      const floatY = Math.sin(t * 0.3 + i * 0.9) * 15
      const size = 2 + rand(i * 19) * 4
      const alpha = 0.06 + rand(i * 37) * 0.08

      flourMotes.push(
        <div
          key={`f${i}`}
          style={{
            position: 'absolute',
            left: baseX + drift,
            top: baseY + floatY,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(240, 225, 200, ${alpha})`,
            filter: 'blur(1px)',
          }}
        />,
      )
    }

    // Layer 2: Warm oven glow gradient — pulsing like radiant heat
    const glowIntensity = 0.12 + Math.sin(t * 0.6) * 0.03
    const glowY = 65 + Math.sin(t * 0.4) * 3

    // Layer 3: Linen texture (banneton/proofing cloth impression)
    const linenLines: React.ReactNode[] = []
    for (let i = 0; i < 12; i++) {
      const y = height * (i / 12) + Math.sin(t * 0.2 + i * 0.5) * 2
      linenLines.push(
        <div
          key={`l${i}`}
          style={{
            position: 'absolute',
            left: 0,
            top: y,
            width: '100%',
            height: 1,
            background: `rgba(180, 160, 130, 0.04)`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {linenLines}
        {/* Oven warmth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% ${glowY}%, rgba(200, 140, 60, ${glowIntensity}), transparent 60%)`,
          }}
        />
        {flourMotes}
        {/* Subtle warm vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(40, 25, 10, 0.25) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let scaleX = 1
      let scaleY = 1

      if (phase === 'enter') {
        // Dough rise: letters swell upward like proofing dough
        const delay = ci / (word.length + 1) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutBack(p) // slight overshoot like dough pushing past its bounds

        charOpacity = Math.min(1, p * 2)
        // Start as flat compressed disc, rise and expand
        scaleX = 0.5 + ep * 0.5
        scaleY = 0.3 + ep * 0.7
        // Rise upward from flat surface
        yOff = (1 - ep) * 40
      } else if (phase === 'hold') {
        // Proofing breath: slow rhythmic expansion like living dough
        const breathCycle = easeInOutSine((Math.sin(t * 1.0 + ci * 0.3) + 1) / 2)
        scaleX = 1 + breathCycle * 0.04
        scaleY = 1 + breathCycle * 0.05
        // Each letter breathes at a slightly different phase
        yOff = -breathCycle * 3

        // Surface cracks: subtle darkening in letter gaps during hold
        const crackPhase = (t * 0.5 + ci * 0.7) % 4
        const crackAlpha = crackPhase > 3 ? (crackPhase - 3) * 0.15 : 0

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color,
              opacity: charOpacity,
              transform: `translateY(${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
              transformOrigin: 'center bottom',
              textShadow: `0 3px 6px rgba(80, 50, 20, 0.4), 0 0 15px rgba(210, 170, 100, 0.15), inset 0 -2px 0 rgba(0,0,0,${crackAlpha})`,
            }}
          >
            {ch}
          </span>
        )
      } else {
        // Deflate: dough punched down — letters compress and flatten
        const delay = ci / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInCubic(p) // accelerating collapse

        charOpacity = 1 - ep * 0.9
        // Flatten back down like punched dough
        scaleX = 1 + ep * 0.6
        scaleY = 1 - ep * 0.7
        yOff = ep * 25
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: 'center bottom',
            textShadow: `0 3px 6px rgba(80, 50, 20, 0.4), 0 0 15px rgba(210, 170, 100, 0.15)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Yeast bubble particles rising from the dough surface
    const bubbles: React.ReactNode[] = []
    if (phase !== 'exit') {
      const bubbleAlpha = phase === 'enter' ? enterProgress * 0.4 : 0.4
      for (let b = 0; b < 8; b++) {
        const bx = width * (0.25 + 0.5 * rand(b * 41 + index))
        const riseCycle = (t * 0.6 + b * 0.8 + rand(b * 29) * 5) % 2.5
        const by = height * 0.55 - riseCycle * 30
        const bSize = 3 + rand(b * 17 + index) * 5
        const bAlpha = bubbleAlpha * Math.max(0, 1 - riseCycle / 2.5)

        bubbles.push(
          <div
            key={`b${b}`}
            style={{
              position: 'absolute',
              left: bx + Math.sin(t * 2 + b) * 5,
              top: by,
              width: bSize,
              height: bSize,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, rgba(240, 220, 180, ${bAlpha}), rgba(210, 180, 130, ${bAlpha * 0.5}) 60%, transparent)`,
              boxShadow: `0 0 ${bSize}px rgba(210, 180, 130, ${bAlpha * 0.3})`,
            }}
          />,
        )
      }
    }

    // Scoring marks: decorative slash across the dough surface
    let scoringMark: React.ReactNode = null
    if (phase === 'hold') {
      const scoreAlpha = 0.08 + Math.sin(t * 1.2) * 0.03
      scoringMark = (
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '30%',
            width: '40%',
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(120, 80, 30, ${scoreAlpha}) 20%, rgba(120, 80, 30, ${scoreAlpha}) 80%, transparent)`,
            transform: `rotate(-8deg)`,
            filter: 'blur(1px)',
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {bubbles}
        {scoringMark}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Trebuchet MS', 'Gill Sans', sans-serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function BreadDoughComponent(props: MotionGraphicProps<BreadDoughConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bread-dough',
  title: 'Kinetic Bread Dough',
  description: 'Bread dough proofing animation. Letters swell upward like yeast-risen dough with a slight overshoot, breathe rhythmically during hold with rising yeast bubbles, and deflate like punched-down dough on exit.',
  tags: ['kinetic', 'typography', 'food', 'bread', 'dough', 'baking', 'yeast', 'organic'],
  category: 'captions',
  component: BreadDoughComponent as any,
  defaultConfig: {
    words: ['RISE', 'PROOF', 'BAKE', 'CRUST'],
    colors: ['#D4A86A', '#C49155', '#E8C98A', '#B87A3D'],
    bgColor: '#1A120A',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RISE', 'PROOF', 'BAKE', 'CRUST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4A86A', '#C49155', '#E8C98A', '#B87A3D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A120A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
