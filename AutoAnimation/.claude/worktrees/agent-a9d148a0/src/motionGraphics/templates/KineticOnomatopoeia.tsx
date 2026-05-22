import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OnomatopoeiaConfig extends KineticBaseConfig {}

// Dramatic onomatopoeia: text grows from tiny to massive with multiple
// expanding shockwave rings radiating outward — think BOOM titles in comics
// Different from MangaSFX (no Japanese convention, no tilt, uses concentric rings on background)

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Multiple staggered shockwave rings
    const ring1 = (time * 1.8) % 1
    const ring2 = ((time * 1.8) + 0.33) % 1
    const ring3 = ((time * 1.8) + 0.66) % 1

    const ringStyle = (progress: number) => ({
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      width: `${60 + progress * 200}%`,
      height: `${60 + progress * 200}%`,
      borderRadius: '50%',
      border: `${Math.max(0.5, 3 * (1 - progress))}px solid rgba(0,0,0,${(1 - progress) * 0.25})`,
      transform: 'translate(-50%, -50%)',
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Shockwave rings */}
        <div style={ringStyle(ring1)} />
        <div style={ringStyle(ring2)} />
        <div style={ringStyle(ring3)} />

        {/* Ben-Day halftone base */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px)',
            backgroundSize: '11px 11px',
          }}
        />

        {/* Radiating straight lines from center — impact feel */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '180%',
            height: '180%',
            transform: 'translate(-50%, -50%)',
            backgroundImage: `repeating-conic-gradient(
              from 0deg,
              transparent 0deg,
              transparent 18deg,
              rgba(0,0,0,0.04) 18deg,
              rgba(0,0,0,0.04) 19.5deg
            )`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const seed = index * 47 + 29

    let scale = 1
    let opacity = 1
    let letterSpacing = 4

    if (phase === 'enter') {
      // Text GROWS from microscopic to final size — dramatic build
      const t = enterProgress
      opacity = Math.min(1, t * 3)

      // Overshoot: 0 → 1.25 → 0.92 → 1.0
      if (t < 0.4) {
        scale = (t / 0.4) * 1.25
        letterSpacing = 4 + (t / 0.4) * 20
      } else if (t < 0.65) {
        const back = (t - 0.4) / 0.25
        scale = 1.25 - back * 0.33
        letterSpacing = 24 - back * 12
      } else if (t < 0.85) {
        const settle = (t - 0.65) / 0.2
        scale = 0.92 + settle * 0.1
        letterSpacing = 12 - settle * 8
      } else {
        scale = 1.02 - ((t - 0.85) / 0.15) * 0.02
        letterSpacing = 4
      }
    } else if (phase === 'hold') {
      scale = 1
      letterSpacing = 4
      // Slow "breathing" pulse
      const breathe = Math.sin(seed * 0.02) * 0.015
      scale = 1 + breathe
    } else {
      // Expand and fade — like a shockwave dissipating
      scale = 1 + exitProgress * 0.8
      letterSpacing = 4 + exitProgress * 30
      opacity = 1 - exitProgress
    }

    // Slight rotation for energy
    const tilt = ((seed % 7) - 3) * 1.8

    // Multiple shockwave rings that emanate during enter
    const ringCount = 3
    const rings = Array.from({ length: ringCount }, (_, i) => {
      const delay = i / ringCount
      const ringT = Math.max(0, (enterProgress - delay * 0.3) / (1 - delay * 0.3))
      return {
        scale: 0.2 + ringT * 2.5,
        opacity: phase === 'enter' ? (1 - ringT) * 0.4 : 0,
      }
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${tilt}deg)`,
          opacity: Math.max(0, opacity),
        }}
      >
        {/* Shockwave rings around text */}
        {rings.map((r, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '120%',
              height: '200%',
              border: `3px solid ${color}`,
              borderRadius: '8px',
              transform: `translate(-50%, -50%) scale(${r.scale})`,
              opacity: r.opacity,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Main text */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: color,
            WebkitTextStroke: '4px #000000',
            textShadow: `
              5px 5px 0 #000,
              -3px -3px 0 #000,
              3px -3px 0 #000,
              -3px 3px 0 #000,
              7px 7px 0 rgba(0,0,0,0.3)
            `,
            whiteSpace: 'nowrap',
            letterSpacing: `${letterSpacing}px`,
            userSelect: 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function OnomatopoeiaComponent(props: MotionGraphicProps<OnomatopoeiaConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-onomatopoeia',
  title: 'Kinetic Onomatopoeia',
  description: 'Dramatic onomatopoeia text grows from zero to massive with letter-spacing explosion, three shockwave rings radiate outward, then text expands and dissolves like a shockwave',
  tags: ['kinetic', 'typography', 'comic', 'onomatopoeia', 'shockwave', 'impact', 'dramatic', 'grow', 'rings'],
  category: 'captions',
  component: OnomatopoeiaComponent as any,
  defaultConfig: {
    words: ['CRASH!', 'BANG!', 'SLAM!', 'CRACK!'],
    colors: ['#FF0000', '#FFD700', '#FF6600', '#FF0099'],
    bgColor: '#000033',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRASH!', 'BANG!', 'SLAM!', 'CRACK!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF0000', '#FFD700', '#FF6600', '#FF0099'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000033', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.4, max: 5, group: 'Timing' },
  ],
})
