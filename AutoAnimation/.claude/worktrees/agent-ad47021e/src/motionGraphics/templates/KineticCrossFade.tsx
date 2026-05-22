import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrossFadeConfig extends KineticBaseConfig {
  overlapDepth: number
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Cinematic letterbox bars + slow vignette pulse
    const vignetteIntensity = 0.5 + Math.sin(time * 0.4) * 0.05

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${vignetteIntensity}) 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Cinematic letterbox top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: Math.floor(height * 0.1),
            background: '#000000',
            pointerEvents: 'none',
          }}
        />
        {/* Cinematic letterbox bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: Math.floor(height * 0.1),
            background: '#000000',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Cross-fade: overlapping opacity layers dissolve between words
    // The key cinematic effect: the outgoing and incoming word overlap in opacity space
    // This is rendered per-word but the visual overlap is achieved via the alpha curves

    // Dissolve curve — S-shaped for a smooth cinema cross-dissolve
    let primaryOpacity = 0
    let primaryScale = 1
    let primaryBlur = 0

    // Secondary ghost of the "previous" word still dissolving out
    // We simulate this using the index-based offset and enter curve shape
    const ghostOpacity = phase === 'enter'
      ? Math.max(0, 1 - smoothstep(enterProgress) * 2) * 0.4
      : 0

    if (phase === 'enter') {
      primaryOpacity = easeInOutSine(enterProgress)
      // Gentle zoom-in during dissolve — classic cinema cross-dissolve
      primaryScale = 0.96 + easeInOutSine(enterProgress) * 0.04
      // Slight focus blur as it dissolves in (like a soft focus transition)
      primaryBlur = (1 - enterProgress) * 1.5
    } else if (phase === 'hold') {
      primaryOpacity = 1
      primaryScale = 1
      primaryBlur = 0
    } else {
      primaryOpacity = 1 - easeInOutSine(exitProgress)
      primaryScale = 1 + easeInOutSine(exitProgress) * 0.04
      primaryBlur = exitProgress * 1.5
    }

    // Luminance layer — a brighter copy that fades faster, like film emulsion
    const luminanceOpacity = phase === 'enter'
      ? Math.max(0, 1 - enterProgress * 2.5) * 0.25
      : phase === 'exit'
      ? Math.max(0, exitProgress * 2.5 - 1.5) * 0.2
      : 0

    // Horizontal separator line — cinematic subtitle-style underline
    const lineWidth = phase === 'enter'
      ? easeInOutSine(enterProgress) * 60
      : phase === 'exit'
      ? (1 - easeInOutSine(exitProgress)) * 60
      : 60

    const lineOpacity = primaryOpacity * 0.5

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Ghost of previous word still dissolving out */}
        {ghostOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${1 + (1 - enterProgress) * 0.02})`,
              opacity: ghostOpacity,
              fontFamily: "'Georgia', 'Palatino', 'Times New Roman', serif",
              fontSize: 'clamp(34px, 10vw, 130px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 5,
              filter: `blur(${(1 - enterProgress) * 2}px)`,
              pointerEvents: 'none',
            }}
          >
            {word}
          </div>
        )}

        {/* Luminance bright layer — film emulsion dissolve character */}
        {luminanceOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${primaryScale})`,
              opacity: luminanceOpacity,
              fontFamily: "'Georgia', 'Palatino', 'Times New Roman', serif",
              fontSize: 'clamp(34px, 10vw, 130px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              letterSpacing: 5,
              pointerEvents: 'none',
            }}
          >
            {word}
          </div>
        )}

        {/* Primary dissolving word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${primaryScale})`,
            opacity: primaryOpacity,
            fontFamily: "'Georgia', 'Palatino', 'Times New Roman', serif",
            fontSize: 'clamp(34px, 10vw, 130px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 5,
            filter: primaryBlur > 0.1 ? `blur(${primaryBlur}px)` : 'none',
            textShadow: `0 1px 20px rgba(0,0,0,0.6), 0 0 40px ${color}20`,
          }}
        >
          {word}
        </div>

        {/* Subtitle underline */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + 42px)',
            left: '50%',
            width: `${lineWidth}%`,
            height: 1,
            background: color,
            transform: 'translateX(-50%)',
            opacity: lineOpacity,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },
}

function CrossFadeComponent(props: MotionGraphicProps<CrossFadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cross-fade',
  title: 'Kinetic Cross Fade',
  description: 'Words dissolve in and out with overlapping opacity layers — cinematic cross-dissolve with letterbox, luminance bloom, and soft focus',
  tags: ['kinetic', 'typography', 'cross-fade', 'dissolve', 'film', 'elegant', 'cinematic'],
  category: 'captions',
  component: CrossFadeComponent as any,
  defaultConfig: {
    words: ['FADE', 'DISSOLVE', 'BLEND', 'CROSS'],
    colors: ['#E8E0D0', '#D4C8B4', '#E8E0D0', '#CCC0A8'],
    bgColor: '#080808',
    cycleDuration: 2.2,
    overlapDepth: 0.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FADE', 'DISSOLVE', 'BLEND', 'CROSS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E0D0', '#D4C8B4', '#E8E0D0', '#CCC0A8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.8, max: 6, group: 'Timing' },
    { key: 'overlapDepth', label: 'Overlap Depth', type: 'number', defaultValue: 0.4, min: 0.1, max: 1.0, group: 'Animation' },
  ],
})
