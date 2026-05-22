import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PortalZoomConfig extends KineticBaseConfig {
  ringCount: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const cx = width / 2
    const cy = height / 2

    // Starfield / tunnel speed lines radiating from center
    const lines: React.ReactNode[] = []
    const numLines = 24
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2
      const speed = 0.6 + rand(i * 31) * 1.2
      const offset = (t * speed * 0.15 + rand(i * 47) * 1) % 1
      const len = (0.1 + rand(i * 67) * 0.3) * Math.min(width, height) * 0.5
      const startR = offset * Math.min(width, height) * 0.45
      const lineAlpha = 0.03 + rand(i * 53) * 0.04

      lines.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx + Math.cos(angle) * startR - 0.5,
            top: cy + Math.sin(angle) * startR - 0.5,
            width: len,
            height: 1,
            transformOrigin: '0 50%',
            transform: `rotate(${(angle * 180) / Math.PI}deg)`,
            background: `rgba(160,200,255,${lineAlpha})`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {lines}
        {/* Deep portal glow */}
        <div
          style={{
            position: 'absolute',
            left: cx - 80,
            top: cy - 80,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(100,160,255,0.06), transparent 70%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__portalZoomConfig ?? { ringCount: 6 }
    const ringCount = cfg.ringCount ?? 6

    const cx = width / 2
    const cy = height / 2

    // Camera dolly THROUGH a portal: text starts tiny (as if far away in the tunnel)
    // and zooms toward viewer, expanding to fill frame

    let textScale = 0
    let textOpacity = 0
    let textBlur = 0
    let portalScale = 0.02  // portal ring base scale
    let portalOpacity = 0

    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      // Text rushes from tiny to full size
      textScale = 0.02 + ep * 0.98
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.05) / 0.95))
      textBlur = (1 - ep) * 5
      portalScale = 0.02 + ep * 0.98
      portalOpacity = Math.max(0, 1 - (enterProgress - 0.6) * 2.5)
    } else if (phase === 'hold') {
      textScale = 1 + holdProgress * 0.01  // subtle breathing
      textOpacity = 1
      textBlur = 0
      portalScale = 0
      portalOpacity = 0
    } else {
      // Text shrinks back into the portal
      const ep = easeInQuad(exitProgress)
      textScale = 1 - ep * 0.95
      textOpacity = 1 - ep
      textBlur = ep * 4
      portalScale = ep * 0.7
      portalOpacity = ep
    }

    // Portal rings: concentric circles that rush toward viewer as text approaches
    const rings: React.ReactNode[] = []
    for (let r = 0; r < ringCount; r++) {
      const ringNorm = r / ringCount
      const ringPhase = (ringNorm + (t * 0.8)) % 1
      const ringSize = ringPhase * Math.max(width, height) * 1.5

      if (portalOpacity < 0.01) break

      const ringAlpha = (1 - ringPhase) * 0.12 * portalOpacity

      rings.push(
        <div
          key={r}
          style={{
            position: 'absolute',
            left: cx - ringSize / 2,
            top: cy - ringSize / 2,
            width: ringSize,
            height: ringSize,
            borderRadius: '50%',
            border: `${1 + (1 - ringPhase) * 2}px solid rgba(${100 + Math.floor(r * 20)},${160 + Math.floor(r * 10)},255,${ringAlpha})`,
            transform: `scale(${portalScale})`,
            transformOrigin: 'center',
          }}
        />,
      )
    }

    // Central portal glow during entry
    const glowAlpha = Math.max(0, portalOpacity * 0.3)

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Portal rings */}
        {rings}

        {/* Portal center glow */}
        {glowAlpha > 0.01 && (
          <div
            style={{
              position: 'absolute',
              left: cx - 120,
              top: cy - 120,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(120,180,255,${glowAlpha}), rgba(80,140,255,${glowAlpha * 0.3}) 50%, transparent 70%)`,
            }}
          />
        )}

        {/* Text zooming through */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            transformOrigin: 'center',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            filter: textBlur > 0.1 ? `blur(${textBlur}px)` : 'none',
            textShadow: `0 0 ${20 + (1 - textScale) * 30}px ${color}60, 0 0 60px ${color}20`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PortalZoomComponent(props: MotionGraphicProps<PortalZoomConfig>) {
  ;(globalThis as any).__portalZoomConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-portal-zoom',
  title: 'Kinetic Portal Zoom',
  description: 'Text rushes from a vanishing point through concentric portal rings toward the viewer, with tunnel speed lines and depth glow',
  tags: ['kinetic', 'typography', 'portal', 'zoom', '3d', 'tunnel', 'dimensional', 'reveal', 'depth'],
  category: 'captions',
  component: PortalZoomComponent as any,
  defaultConfig: {
    words: ['ENTER', 'ZOOM', 'WARP', 'DIVE'],
    colors: ['#A0D4FF', '#80C0FF', '#C0E4FF', '#60B0FF'],
    bgColor: '#040810',
    cycleDuration: 1.4,
    ringCount: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ENTER', 'ZOOM', 'WARP', 'DIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A0D4FF', '#80C0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'ringCount', label: 'Portal Rings', type: 'number', defaultValue: 6, min: 3, max: 12, group: 'Animation' },
  ],
})
