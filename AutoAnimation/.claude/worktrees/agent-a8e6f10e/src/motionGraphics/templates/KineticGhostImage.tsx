import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GhostImageConfig extends KineticBaseConfig {
  ghostDelay: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Display ghosting is caused by slow pixel response time — previous frame
// "trails" persist as the new frame writes, creating multiple echo copies

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle IPS glow / VA halo around bright regions */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(20,20,40,${0.3 + Math.sin(time * 0.5) * 0.05}) 0%, rgba(0,0,0,0) 60%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Panel backlight non-uniformity */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              180deg,
              rgba(255,255,255,0.006) 0px,
              transparent 2px,
              transparent 4px
            )`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const f = frame ?? 0
    const fp = fps ?? 30
    const seed = index * 83 + 37

    // Ghost trails — previous text's decay trail moving behind the current text
    // Multiple ghost copies at increasing delays and opacity falloff
    // Ghost offset: trails appear shifted slightly right (phosphor decay direction)

    const ghostCount = 4
    const ghostOffsets = [3, 7, 12, 18]       // px offset per ghost layer
    const ghostOpacities = [0.35, 0.2, 0.1, 0.05] // relative opacity per ghost

    let mainOpacity = 0
    let ghostMultiplier = 0

    if (phase === 'enter') {
      // Ghosts arrive first — fast response channel, then text solidifies
      // This mimics: old text fading, new text building through pixel response
      mainOpacity = enterProgress > 0.4 ? Math.min(1, (enterProgress - 0.4) / 0.6) : 0
      ghostMultiplier = enterProgress < 0.6 ? Math.sin(enterProgress * Math.PI) : 0.3 * (1 - enterProgress)
    } else if (phase === 'hold') {
      mainOpacity = 1
      // Slight ghost persists even when stable (VA ghosting during hold)
      ghostMultiplier = 0.08 + Math.sin(holdProgress * Math.PI * 3 + seed) * 0.04
    } else {
      mainOpacity = 1 - exitProgress
      // Ghosts linger after text fades — classic slow pixel response
      ghostMultiplier = exitProgress > 0.3 ? (exitProgress - 0.3) / 0.7 * 0.6 : exitProgress * 0.3
    }

    const fontStyle = {
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize: 'clamp(40px, 11vw, 160px)' as const,
      fontWeight: 900,
      whiteSpace: 'nowrap' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 6,
    }

    return (
      <>
        {/* Ghost trail layers — behind main text */}
        {ghostCount > 0 && ghostOffsets.map((offsetX, gi) => {
          const gOpacity = ghostOpacities[gi] * ghostMultiplier
          if (gOpacity < 0.005) return null
          // Ghosts shift right and slightly down (pixel decay direction)
          const offY = gi * 0.8
          return (
            <div
              key={gi}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offY}px))`,
                opacity: gOpacity,
                color,
                ...fontStyle,
                // Desaturate ghosts — pixel response reduces saturation
                filter: `saturate(${Math.max(0, 100 - gi * 25)}%) blur(${gi * 0.3}px)`,
              }}
            >
              {word}
            </div>
          )
        })}
        {/* Main text — sharp, fully resolved */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: mainOpacity,
            color,
            ...fontStyle,
            textShadow: `0 0 5px ${color}40`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function GhostImageComponent(props: MotionGraphicProps<GhostImageConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ghost-image',
  title: 'Kinetic Ghost Image',
  description: 'LCD/VA display ghosting — slow pixel response time leaves trailing ghost copies of text shifted right, decaying as new text solidifies',
  tags: ['kinetic', 'typography', 'ghost', 'ghosting', 'lcd', 'va', 'pixel-response', 'display', 'glitch', 'hardware'],
  category: 'captions',
  component: GhostImageComponent as any,
  defaultConfig: {
    words: ['TRAIL', 'GHOST', 'ECHO', 'LINGER'],
    colors: ['#ff6060', '#ff4040', '#ff8080', '#ff5050'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.4,
    ghostDelay: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRAIL', 'GHOST', 'ECHO', 'LINGER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff6060', '#ff4040', '#ff8080', '#ff5050'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'ghostDelay', label: 'Ghost Offset (px)', type: 'number', defaultValue: 3, min: 1, max: 20, group: 'Animation' },
  ],
})
