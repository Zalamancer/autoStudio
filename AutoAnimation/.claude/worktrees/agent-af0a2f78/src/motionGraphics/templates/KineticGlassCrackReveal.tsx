import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GlassCrackRevealConfig extends KineticBaseConfig {
  crackCount: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

// Generate crack segments radiating from an impact point
function genCracks(count: number, cx: number, cy: number, maxR: number, seed: number) {
  const cracks: { angle: number; length: number; branches: { dist: number; angle: number; len: number }[] }[] = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand(i * 31 + seed) * 0.6
    const length = maxR * (0.4 + rand(i * 47 + seed) * 0.6)
    const branches: { dist: number; angle: number; len: number }[] = []
    const numBranches = 1 + Math.floor(rand(i * 67 + seed) * 3)
    for (let b = 0; b < numBranches; b++) {
      branches.push({
        dist: length * (0.3 + rand(i * 19 + b * 37 + seed) * 0.5),
        angle: angle + (rand(i * 23 + b * 53 + seed) - 0.5) * 1.2,
        len: length * (0.1 + rand(i * 29 + b * 61 + seed) * 0.3),
      })
    }
    cracks.push({ angle, length, branches })
  }
  return cracks
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const cx = width / 2
    const cy = height / 2

    // Background with subtle light scatter
    const scatterAlpha = 0.04 + Math.sin(t * 0.7) * 0.02
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${cx}px ${cy}px, rgba(200,220,255,${scatterAlpha}), transparent 60%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__glassCrackConfig ?? { crackCount: 10 }
    const crackCount = cfg.crackCount ?? 10

    const cx = width / 2
    const cy = height / 2
    const maxR = Math.min(width, height) * 0.48
    const cracks = genCracks(crackCount, cx, cy, maxR, index * 137)

    let crackSpread = 0
    let glassOpacity = 1
    let textOpacity = 0
    let textScale = 0.85
    let impactScale = 0

    if (phase === 'enter') {
      // Cracks spread rapidly, then glass opacity drops revealing text
      crackSpread = easeOutExpo(Math.min(1, enterProgress * 2.5))
      glassOpacity = Math.max(0, 1 - (enterProgress - 0.4) * 2.5)
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.3) / 0.7))
      textScale = 0.85 + textOpacity * 0.15
      impactScale = easeOutExpo(Math.min(1, enterProgress * 4))
    } else if (phase === 'hold') {
      crackSpread = 1
      glassOpacity = 0
      textOpacity = 1
      textScale = 1
      impactScale = 1
    } else {
      // Glass reforms and shatters outward
      crackSpread = 1
      glassOpacity = easeInQuad(exitProgress) * 0.4
      textOpacity = 1 - easeInQuad(exitProgress)
      textScale = 1 + easeInQuad(exitProgress) * 0.05
    }

    // Build crack line elements
    const crackLines: React.ReactNode[] = []
    cracks.forEach((crack, ci) => {
      const len = crack.length * crackSpread
      const endX = cx + Math.cos(crack.angle) * len
      const endY = cy + Math.sin(crack.angle) * len
      const lineLen = Math.hypot(endX - cx, endY - cy)
      const lineAngle = (crack.angle * 180) / Math.PI
      const crackAlpha = 0.18 + rand(ci * 41 + index) * 0.12

      crackLines.push(
        <div
          key={`c${ci}`}
          style={{
            position: 'absolute',
            left: cx,
            top: cy - 0.5,
            width: lineLen,
            height: 1,
            transformOrigin: '0 50%',
            transform: `rotate(${lineAngle}deg)`,
            background: `linear-gradient(90deg, rgba(220,235,255,${crackAlpha}), rgba(180,200,230,${crackAlpha * 0.4}) 70%, transparent)`,
            opacity: glassOpacity + crackSpread * (1 - glassOpacity),
          }}
        />,
      )

      // Branches
      crack.branches.forEach((br, bi) => {
        if (crackSpread < 0.2) return
        const branchSpread = Math.max(0, (crackSpread - 0.15) / 0.85)
        const branchLen = br.len * branchSpread
        const brX = cx + Math.cos(crack.angle) * br.dist * crackSpread
        const brY = cy + Math.sin(crack.angle) * br.dist * crackSpread
        const brAngle = (br.angle * 180) / Math.PI

        crackLines.push(
          <div
            key={`b${ci}_${bi}`}
            style={{
              position: 'absolute',
              left: brX,
              top: brY - 0.5,
              width: branchLen,
              height: 0.5,
              transformOrigin: '0 50%',
              transform: `rotate(${brAngle}deg)`,
              background: `linear-gradient(90deg, rgba(200,220,240,${crackAlpha * 0.7}), transparent)`,
              opacity: glassOpacity + crackSpread * (1 - glassOpacity),
            }}
          />,
        )
      })
    })

    // Glass sheen overlay (decreases as cracks reveal text)
    const sheenAngle = 125 + Math.sin(t * 0.3) * 8
    const sheenAlpha = glassOpacity * 0.12

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Text layer revealed underneath */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            textShadow: textOpacity > 0.5 ? `0 0 30px ${color}40` : 'none',
          }}
        >
          {word}
        </div>

        {/* Glass overlay with sheen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${sheenAngle}deg, rgba(200,220,255,${sheenAlpha}), transparent 60%)`,
            opacity: glassOpacity,
          }}
        />

        {/* Impact point */}
        {impactScale > 0 && (
          <div
            style={{
              position: 'absolute',
              left: cx - 8 * impactScale,
              top: cy - 8 * impactScale,
              width: 16 * impactScale,
              height: 16 * impactScale,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255,255,255,0.25), rgba(220,235,255,0.1) 50%, transparent 70%)`,
            }}
          />
        )}

        {/* Crack lines rendered on top of glass */}
        {crackLines}
      </div>
    )
  },
}

function GlassCrackRevealComponent(props: MotionGraphicProps<GlassCrackRevealConfig>) {
  ;(globalThis as any).__glassCrackConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-glass-crack-reveal',
  title: 'Kinetic Glass Crack Reveal',
  description: 'Glass pane cracks radially from an impact point, spreading spiderweb fractures that shatter to expose the word underneath',
  tags: ['kinetic', 'typography', 'glass', 'crack', 'shatter', 'destruction', 'reveal', 'impact'],
  category: 'captions',
  component: GlassCrackRevealComponent as any,
  defaultConfig: {
    words: ['BREAK', 'SHATTER', 'CRACK', 'EXPOSE'],
    colors: ['#E8F2FF', '#C4D8F8', '#F0F6FF', '#B8D0F0'],
    bgColor: '#080c18',
    cycleDuration: 1.5,
    crackCount: 10,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREAK', 'SHATTER', 'CRACK', 'EXPOSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8F2FF', '#C4D8F8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080c18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'crackCount', label: 'Crack Lines', type: 'number', defaultValue: 10, min: 4, max: 20, group: 'Animation' },
  ],
})
