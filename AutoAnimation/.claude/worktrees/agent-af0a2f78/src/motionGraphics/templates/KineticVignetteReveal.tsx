import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VignetteRevealConfig extends KineticBaseConfig {
  vignetteStrength: number
}

// Vignette reveal — in-camera vignetting:
// Some lenses (especially fast primes wide-open) produce heavy corner darkening.
// Here the vignette is used dramatically: a pitch-black vignette completely closes
// then iris-opens from the center outward, revealing the text like a spotlight
// emerging from total darkness. Classic silent-film / iris-wipe effect modernized.

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, enterProgress, holdProgress, exitProgress }: BackgroundRenderProps) => {
    const ep = (enterProgress as number) ?? 0
    const xp = (exitProgress as number) ?? 0
    const hp = (holdProgress as number) ?? 0

    // Iris radius: 0% (closed) → 100% (open) → closes again on exit
    let irisOpen: number
    if (hp > 0) {
      irisOpen = 1 - xp * 0.85
    } else {
      irisOpen = easeInOutCubic(ep)
    }

    // Transparent radius of the vignette circle
    const clearRadius = irisOpen * 60  // percent of frame width
    const fadeEdge = 20  // how wide the soft edge is

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Subtle radial texture in center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 45%)`,
            pointerEvents: 'none',
          }}
        />
        {/* The vignette iris — main effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent ${Math.max(0, clearRadius)}%, rgba(0,0,0,0.5) ${clearRadius + fadeEdge * 0.3}%, rgba(0,0,0,0.92) ${clearRadius + fadeEdge}%, #000000 ${clearRadius + fadeEdge * 2}%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Additional deep corner darkness */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent ${clearRadius * 0.6}%, rgba(0,0,0,0.3) 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const eased = phase === 'enter'
      ? easeOutCubic(enterProgress)
      : phase === 'exit'
        ? 1 - easeOutCubic(exitProgress)
        : 1

    const opacity = eased
    const scale = 0.96 + eased * 0.04  // tiny scale-in with the reveal

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          whiteSpace: 'nowrap',
          opacity,
        }}
      >
        {/* Soft glow fills the iris */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(255,255,220,0.3)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            filter: 'blur(20px)',
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textShadow: `0 0 40px rgba(255,240,180,0.2), 0 2px 8px rgba(0,0,0,0.9)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function VignetteRevealComponent(props: MotionGraphicProps<VignetteRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vignette-reveal',
  title: 'Kinetic Vignette Reveal',
  description: 'Iris vignette reveal: a pitch-black vignette opens from the center outward like a camera iris, revealing text from total darkness — silent-film iris wipe reimagined',
  tags: ['kinetic', 'typography', 'film', 'camera', 'vignette', 'iris', 'reveal', 'cinematic', 'lens', 'dark'],
  category: 'captions',
  component: VignetteRevealComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'IRIS', 'OPEN', 'LIGHT'],
    colors: ['#F5E8C8', '#FFFFFF', '#F0E0B0', '#FFE8A0'],
    bgColor: '#020202',
    cycleDuration: 1.6,
    vignetteStrength: 92,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVEAL', 'IRIS', 'OPEN', 'LIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E8C8', '#FFFFFF', '#F0E0B0', '#FFE8A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020202', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'vignetteStrength', label: 'Vignette Strength (%)', type: 'number', defaultValue: 92, min: 50, max: 100, group: 'Animation' },
  ],
})
