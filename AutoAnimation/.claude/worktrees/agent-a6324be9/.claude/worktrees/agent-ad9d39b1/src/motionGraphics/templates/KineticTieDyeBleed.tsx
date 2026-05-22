import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TieDyeBleedConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Tie-dye: fabric folded/crumpled/bound with rubber bands, dyes squirted on.
// The BLEED is the animation: dye wicks along fiber, blooming and spreading.
// Colors bleed into each other at boundaries — organic, unpredictable spread.
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0
    // Wet fabric with radial dye bleed zones
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Multiple dye bloom zones */}
        {[
          { cx: '20%', cy: '30%', color: '#FF6B9D', r: '35%' },
          { cx: '75%', cy: '25%', color: '#FFD700', r: '30%' },
          { cx: '60%', cy: '75%', color: '#00CED1', r: '40%' },
          { cx: '25%', cy: '70%', color: '#FF4500', r: '28%' },
          { cx: '50%', cy: '50%', color: '#9B59B6', r: '25%' },
        ].map((zone, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: zone.cx,
              top: zone.cy,
              width: zone.r,
              height: zone.r,
              transform: `translate(-50%, -50%) scale(${1 + Math.sin(f * 0.08 + i) * 0.03})`,
              background: `radial-gradient(circle, ${zone.color}40 0%, ${zone.color}15 40%, transparent 70%)`,
              borderRadius: '50%',
              mixBlendMode: 'multiply',
            }}
          />
        ))}
        {/* Wet fabric sheen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 60% at 40% 35%, rgba(255,255,255,0.08) 0%, transparent 60%)',
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

    // Dye colors that bleed
    const dyeColors = [
      ['#FF1493', '#FF69B4', '#FFB6C1'],  // Pink to light pink
      ['#00CED1', '#40E0D0', '#7FFFD4'],  // Teal to aqua
      ['#FF4500', '#FF6347', '#FFA07A'],  // Red-orange
      ['#9400D3', '#8A2BE2', '#DA70D6'],  // Purple
      ['#FFD700', '#FFA500', '#FF8C00'],  // Gold to orange
    ]

    const palette = dyeColors[index % dyeColors.length]

    let bleedRadius = 0
    let opacity = 0
    let colorMix = 0  // How much colors have blended

    if (phase === 'enter') {
      bleedRadius = easeOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 2)
      colorMix = enterProgress
    } else if (phase === 'hold') {
      bleedRadius = 1
      opacity = 1
      colorMix = 1 + Math.sin(f * 0.2) * 0.05
    } else {
      bleedRadius = 1 + exitProgress * 0.5  // Over-bleeds and fades
      opacity = Math.max(0, 1 - exitProgress * 1.5)
      colorMix = 1
    }

    const fontSize = 'clamp(52px, 14vw, 190px)'

    // Build layered bleed effect via multiple text layers
    const bleedLayers = [
      { blur: bleedRadius * 25, opacity: 0.25, color: palette[2], offsetX: -2, offsetY: 1 },
      { blur: bleedRadius * 15, opacity: 0.35, color: palette[1], offsetX: 1, offsetY: -1 },
      { blur: bleedRadius * 8,  opacity: 0.5,  color: palette[0], offsetX: 0, offsetY: 0 },
      { blur: bleedRadius * 3,  opacity: 0.7,  color: color, offsetX: 0, offsetY: 0 },
      { blur: 0,                opacity: 0.9,  color: color, offsetX: 0, offsetY: 0 },
    ]

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
        {bleedLayers.map((layer, li) => (
          <div
            key={li}
            style={{
              position: li === 0 ? 'relative' : 'absolute',
              top: li === 0 ? undefined : layer.offsetY,
              left: li === 0 ? undefined : layer.offsetX,
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize,
              fontWeight: 900,
              letterSpacing: 2,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              color: layer.color,
              filter: `blur(${layer.blur}px)`,
              opacity: layer.opacity,
              mixBlendMode: li < 3 ? 'multiply' : 'normal',
            }}
          >
            {word}
          </div>
        ))}
      </div>
    )
  },
}

function TieDyeBleedComponent(props: MotionGraphicProps<TieDyeBleedConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tie-dye-bleed',
  title: 'Kinetic Tie-Dye Bleed',
  description: 'Multiple dye colors wick outward through wet fabric fibers, blooming from center — colors bleed and mix at boundaries with authentic tie-dye spreading motion and saturated radial color zones',
  tags: ['kinetic', 'typography', 'tie-dye', 'bleed', 'dye', 'craft', 'textile', 'fabric', 'psychedelic', 'bloom', 'color'],
  category: 'captions',
  component: TieDyeBleedComponent as any,
  defaultConfig: {
    words: ['BLEED', 'BLOOM', 'DYE', 'FLOW'],
    colors: ['#FF1493', '#00CED1', '#FFD700', '#9400D3'],
    bgColor: '#FFF5F0',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BLEED', 'BLOOM', 'DYE', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Dye Colors', type: 'text-array', defaultValue: ['#FF1493', '#00CED1', '#FFD700', '#9400D3'], group: 'Style' },
    { key: 'bgColor', label: 'Fabric Color', type: 'color', defaultValue: '#FFF5F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.4, max: 5, group: 'Timing' },
  ],
})
