import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpotUVConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Spot UV: UV-curable varnish applied to specific areas of a printed piece.
// The effect is invisible until a UV light or angle reveals the text/image
// with a brilliant high-gloss sheen against the matte background
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Matte paper texture */}
        {Array.from({ length: 200 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${rand(i * 17) * 100}%`,
              top: `${rand(i * 31) * 100}%`,
              width: rand(i * 5) * 1.5 + 0.3,
              height: rand(i * 5) * 1.5 + 0.3,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.03)',
            }}
          />
        ))}
        {/* UV lamp sweep effect on background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 40% 60% at ${30 + Math.sin(f * 0.04) * 40}% 50%, rgba(200,180,255,0.06) 0%, transparent 70%)`,
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

    // Spot UV stages:
    // 1. Varnish coated (invisible, same color as paper)
    // 2. UV lamp sweeps across — text reveals as brilliant gloss
    // 3. Hold: sheen angle changes as "light moves"
    // 4. Exit: lamp sweeps away, text returns to invisible

    let uvRevealProgress = 0  // 0 = invisible, 1 = fully revealed
    let lightAngle = 30       // Angle of specular highlight
    let glossIntensity = 0
    let opacity = 1

    if (phase === 'enter') {
      const t = enterProgress
      // UV lamp sweeps left-to-right — progressive reveal
      uvRevealProgress = easeInOutCubic(Math.min(1, t * 1.2))
      lightAngle = 30 + (1 - t) * 40  // Light starts from far angle
      glossIntensity = uvRevealProgress
    } else if (phase === 'hold') {
      uvRevealProgress = 1
      // Light gently pans on hold creating living sheen
      lightAngle = 30 + Math.sin(f * 0.35) * 25
      glossIntensity = 0.85 + Math.sin(f * 0.5) * 0.15
    } else {
      // UV lamp sweeps away — right-to-left disappear
      uvRevealProgress = Math.max(0, 1 - exitProgress * 1.3)
      lightAngle = 30 - exitProgress * 50
      glossIntensity = uvRevealProgress
      opacity = 0.3 + uvRevealProgress * 0.7
    }

    const fontSize = 'clamp(52px, 14vw, 190px)'
    const fontStyle: React.CSSProperties = {
      fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
      fontSize,
      fontWeight: 900,
      letterSpacing: 8,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
    }

    // The matte text (always present, matches paper — nearly invisible)
    const matteColor = color + '15'  // 8% opacity — barely visible

    // UV revealed: brilliant gloss
    const glossColor = color

    // Clip the reveal using a horizontal gradient — UV lamp sweep
    const revealClip = `inset(0 ${(1 - uvRevealProgress) * 100}% 0 0)`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {/* Matte base (always rendered, nearly invisible) */}
        <div
          style={{
            ...fontStyle,
            color: matteColor,
            position: 'relative',
            letterSpacing: fontStyle.letterSpacing,
          }}
        >
          {word}
        </div>

        {/* UV-revealed gloss layer — sweeps in */}
        <div
          style={{
            ...fontStyle,
            color: glossColor,
            position: 'absolute',
            top: 0,
            left: 0,
            clipPath: revealClip,
            // Deep gloss: layered shadows + saturated color
            textShadow: glossIntensity > 0.3
              ? `0 0 ${glossIntensity * 20}px ${color}40, 0 2px 4px rgba(0,0,0,0.15)`
              : 'none',
          }}
        >
          {word}

          {/* Specular highlight — the key UV gloss indicator */}
          {glossIntensity > 0.2 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(${lightAngle}deg, transparent 20%, rgba(255,255,255,${glossIntensity * 0.7}) 40%, rgba(255,255,255,${glossIntensity * 0.9}) 50%, rgba(255,255,255,${glossIntensity * 0.5}) 60%, transparent 80%)`,
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* UV lamp beam line */}
        {phase === 'enter' && uvRevealProgress > 0 && uvRevealProgress < 0.98 && (
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              bottom: '-20%',
              left: `${uvRevealProgress * 100}%`,
              width: 3,
              background: `linear-gradient(180deg, transparent, rgba(180,160,255,0.6) 30%, rgba(220,200,255,0.9) 50%, rgba(180,160,255,0.6) 70%, transparent)`,
              boxShadow: '0 0 12px 4px rgba(180,160,255,0.4)',
              pointerEvents: 'none',
              transform: 'translateX(-50%)',
            }}
          />
        )}
      </div>
    )
  },
}

function SpotUVComponent(props: MotionGraphicProps<SpotUVConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spot-uv',
  title: 'Kinetic Spot UV',
  description: 'UV varnish coated text reveals under a sweeping UV lamp beam — text emerges from invisible matte to brilliant high-gloss with animated specular sheen, then fades as lamp passes',
  tags: ['kinetic', 'typography', 'print', 'UV', 'varnish', 'gloss', 'reveal', 'spot', 'luxury', 'sheen'],
  category: 'captions',
  component: SpotUVComponent as any,
  defaultConfig: {
    words: ['GLOSS', 'SHINE', 'REVEAL', 'COAT'],
    colors: ['#0A0A1A', '#1A0A2E', '#2A1A0E', '#0A1A2A'],
    bgColor: '#F0EDE8',
    cycleDuration: 1.7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GLOSS', 'SHINE', 'REVEAL', 'COAT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0A0A1A', '#1A0A2E', '#2A1A0E', '#0A1A2A'], group: 'Style' },
    { key: 'bgColor', label: 'Paper Color', type: 'color', defaultValue: '#F0EDE8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.7, min: 0.5, max: 5, group: 'Timing' },
  ],
})
