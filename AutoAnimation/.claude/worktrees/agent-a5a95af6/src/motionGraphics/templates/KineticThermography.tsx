import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ThermographyConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Thermography: wet ink + thermographic powder dusted on, then passed under
// infrared heat tunnel. Powder melts and fuses, raising the ink into
// tactile raised lettering — the text literally GROWS upward
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0
    // Heat shimmer waves during process
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Fine powder dust particles */}
        {Array.from({ length: 40 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${rand(i * 11) * 100}%`,
              top: `${rand(i * 23) * 100}%`,
              width: rand(i * 7) * 2 + 0.5,
              height: rand(i * 7) * 2 + 0.5,
              borderRadius: '50%',
              background: 'rgba(180,120,60,0.08)',
            }}
          />
        ))}
        {/* Heat shimmer gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 80% 30% at 50% ${50 + Math.sin(f * 0.05) * 5}%, rgba(255,180,60,0.04) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
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
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0

    let raiseAmount = 0      // How much raised (3D height)
    let raiseScale = 1       // XY expansion as powder fuses
    let gloss = 0            // Surface gloss (melted = shiny)
    let opacity = 0
    let heatShimmer = 0      // Distortion during heat phase

    if (phase === 'enter') {
      const t = enterProgress
      if (t < 0.25) {
        // Phase 1: Powder dusting — text appears flat, dusty
        const p = t / 0.25
        opacity = p
        raiseAmount = 0
        raiseScale = 1
        gloss = 0
        heatShimmer = 0
      } else if (t < 0.65) {
        // Phase 2: Heat tunnel — text RISES and shimmers
        const p = (t - 0.25) / 0.4
        const eased = easeOutCubic(p)
        opacity = 1
        raiseAmount = eased * 1   // Goes up
        raiseScale = 1 + eased * 0.03  // Powder expansion
        gloss = eased * 0.7
        heatShimmer = Math.sin(f * 1.5) * (1 - p) * 3
      } else {
        // Phase 3: Cooling — fully raised, shiny
        const p = (t - 0.65) / 0.35
        opacity = 1
        raiseAmount = 1
        raiseScale = 1 + 0.03
        gloss = 0.7 + p * 0.3
        heatShimmer = 0
      }
    } else if (phase === 'hold') {
      opacity = 1
      raiseAmount = 1
      raiseScale = 1.03
      gloss = 1
      // Subtle sheen sweep on hold
      heatShimmer = 0
    } else {
      opacity = Math.max(0, 1 - exitProgress * 1.5)
      raiseAmount = 1 - exitProgress
      raiseScale = 1 + 0.03 * (1 - exitProgress)
      gloss = 1 - exitProgress
    }

    const fontSize = 'clamp(52px, 13vw, 175px)'
    const fontStyle: React.CSSProperties = {
      fontFamily: "'Times New Roman', 'Georgia', serif",
      fontSize,
      fontWeight: 700,
      letterSpacing: 4,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
    }

    // Raised text effect via multiple shadows simulating relief height
    const shadowLayers = raiseAmount > 0.1 ? Array.from({ length: Math.ceil(raiseAmount * 6) }, (_, i) => {
      const h = (i + 1) * 0.5
      return `0 ${h}px ${h * 0.5}px rgba(0,0,0,${0.12 - i * 0.012})`
    }).join(', ') : 'none'

    // Glossy highlight sweep
    const holdPhaseProgress = phase === 'hold' ? (Math.sin(f * 0.3) * 0.5 + 0.5) : 0
    const sheenX = 20 + holdPhaseProgress * 60

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${raiseScale}) translateX(${heatShimmer}px)`,
          opacity,
        }}
      >
        {/* Powder layer (dusty, flat) — visible before melting */}
        {raiseAmount < 0.5 && (
          <div
            style={{
              ...fontStyle,
              position: 'absolute',
              top: 0,
              left: 0,
              color: color,
              filter: `blur(${(1 - raiseAmount * 2) * 1.5}px)`,
              opacity: 1 - raiseAmount * 2,
            }}
          >
            {word}
          </div>
        )}
        {/* Main raised text */}
        <div
          style={{
            ...fontStyle,
            position: 'relative',
            color,
            textShadow: shadowLayers,
            // Gloss via gradient overlay
            WebkitTextStroke: gloss > 0.3 ? `0.5px rgba(255,255,255,${gloss * 0.2})` : undefined,
          }}
        >
          {word}
          {/* Gloss sheen overlay */}
          {gloss > 0.5 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(${sheenX}deg, transparent 30%, rgba(255,255,255,${gloss * 0.4}) 50%, transparent 70%)`,
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function ThermographyComponent(props: MotionGraphicProps<ThermographyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-thermography',
  title: 'Kinetic Thermography',
  description: 'Thermographic powder applied to wet ink then heat-fused under infrared tunnel — text rises from flat to tactile raised lettering with visible glossy sheen, the entire raise process animated',
  tags: ['kinetic', 'typography', 'print', 'thermography', 'raised', 'tactile', 'emboss', 'heat', 'gloss', 'business-card'],
  category: 'captions',
  component: ThermographyComponent as any,
  defaultConfig: {
    words: ['RAISE', 'FUSE', 'GLOSS', 'RELIEF'],
    colors: ['#1A1A2E', '#8B0000', '#1B4D3E', '#2C1810'],
    bgColor: '#FAFAF5',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RAISE', 'FUSE', 'GLOSS', 'RELIEF'], group: 'Content' },
    { key: 'colors', label: 'Ink Colors', type: 'text-array', defaultValue: ['#1A1A2E', '#8B0000', '#1B4D3E', '#2C1810'], group: 'Style' },
    { key: 'bgColor', label: 'Paper Color', type: 'color', defaultValue: '#FAFAF5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
