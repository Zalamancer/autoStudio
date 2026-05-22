import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonHaloConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Neon sign flicker — very subtle ambient pulse
    const pulse = 0.5 + Math.sin(time * 1.1) * 0.5
    const driftX = 50 + Math.sin(time * 0.25) * 8
    const driftY = 50 + Math.cos(time * 0.3) * 6

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Neon ambient bloom on wall behind sign */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${driftX}% ${driftY}%, rgba(180,0,255,${0.025 + pulse * 0.015}), transparent 55%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Secondary warm neon spill */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${100 - driftX}% ${driftY}%, rgba(0,220,255,0.018), transparent 50%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Deep vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 53 + 29

    // Three layers: core text, glow outline, outer halo
    // On enter/exit the halo expands/collapses and layers scale in
    let coreScale = 1
    let glowScale = 1
    let haloScale = 1
    let mainOpacity = 0
    let haloOpacity = 0

    if (phase === 'enter') {
      // Halo blooms in first (overshoots), then core snaps in
      coreScale = 0.85 + enterProgress * 0.15
      glowScale = 0.7 + enterProgress * 0.45
      haloScale = 0.4 + enterProgress * 0.9
      mainOpacity = enterProgress
      haloOpacity = enterProgress * 0.6
    } else if (phase === 'hold') {
      // Neon pulse — halo breathes, core stays solid
      const breathe = Math.sin(f * 0.09 + seed) * 0.5 + Math.sin(f * 0.17 + seed * 1.3) * 0.3
      coreScale = 1
      glowScale = 1 + breathe * 0.03
      haloScale = 1 + breathe * 0.07
      mainOpacity = 1
      haloOpacity = 0.35 + breathe * 0.12
    } else {
      // Halo implodes faster than core fades
      coreScale = 1 - exitProgress * 0.12
      glowScale = 1 - exitProgress * 0.2
      haloScale = 1 + exitProgress * 0.15
      mainOpacity = 1 - exitProgress
      haloOpacity = (1 - exitProgress) * 0.4
    }

    const fontStyle = {
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontSize: 'clamp(40px, 10vw, 140px)',
      fontWeight: 800 as const,
      whiteSpace: 'nowrap' as const,
      letterSpacing: 3,
      textTransform: 'uppercase' as const,
    }

    const baseTransform = (scale: number) =>
      `translate(-50%, -50%) scale(${scale})`

    return (
      <>
        {/* Outer halo — wide diffuse bloom */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: baseTransform(haloScale),
            ...fontStyle,
            color: 'rgba(180,0,255,0.3)',
            opacity: haloOpacity,
            filter: 'blur(14px)',
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Glow outline — tight bloom around letterforms */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: baseTransform(glowScale),
            ...fontStyle,
            color: 'rgba(0,210,255,0.65)',
            opacity: mainOpacity * 0.75,
            filter: 'blur(4px)',
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Core neon tube — crisp colored text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: baseTransform(coreScale),
            ...fontStyle,
            color,
            opacity: mainOpacity,
            textShadow: '0 0 8px rgba(0,220,255,0.6), 0 0 2px rgba(255,255,255,0.8)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function NeonHaloComponent(props: MotionGraphicProps<NeonHaloConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-halo',
  title: 'Kinetic Neon Halo',
  description: 'Neon glow effect: crisp core text + tight glow outline + diffuse outer halo that blooms on enter and pulses on hold',
  tags: ['kinetic', 'typography', 'neon', 'glow', 'halo', 'bloom', 'electric', 'colorful'],
  category: 'captions',
  component: NeonHaloComponent as any,
  defaultConfig: {
    words: ['GLOW', 'NEON', 'LIVE', 'BUZZ'],
    colors: ['#e0f8ff', '#ffffff', '#f0e0ff', '#e0f8ff'],
    bgColor: '#060608',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GLOW', 'NEON', 'LIVE', 'BUZZ'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e0f8ff', '#ffffff', '#f0e0ff', '#e0f8ff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060608', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 5, group: 'Timing' },
  ],
})
