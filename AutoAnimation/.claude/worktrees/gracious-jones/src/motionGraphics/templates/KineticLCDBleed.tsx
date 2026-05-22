import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LCDBleedConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Bleed intensity pulses slowly — backlight leaking through panel edges
    const bleedIntensity = 0.12 + Math.sin(time * 0.7) * 0.06

    // Hotspot positions: corners and edges typical of LCD backlight bleed
    const hotspots = [
      { x: '0%',   y: '0%',   rx: '35%', ry: '30%' },
      { x: '100%', y: '0%',   rx: '30%', ry: '28%' },
      { x: '0%',   y: '100%', rx: '32%', ry: '26%' },
      { x: '100%', y: '100%', rx: '28%', ry: '32%' },
      { x: '50%',  y: '0%',   rx: '20%', ry: '18%' },
    ]

    // Slight warm-tint flicker
    const warmTick = Math.floor(time * 3) % 5
    const warmR = 240 + warmTick * 2
    const warmG = 220 + warmTick
    const warmB = 180

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Backlight bleed hotspots */}
        {hotspots.map((h, i) => {
          const pulse = 0.8 + Math.sin(time * 1.1 + i * 1.3) * 0.2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: h.x,
                top: h.y,
                width: h.rx,
                height: h.ry,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(ellipse at center, rgba(${warmR},${warmG},${warmB},${bleedIntensity * pulse}) 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Subtle IPS glow — slight blue-white cast across center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(180,200,255,${0.04 + Math.sin(time * 0.4) * 0.015}) 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Horizontal banding — uneven backlight rows */}
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${20 + i * 20 + Math.sin(time * 0.3 + i) * 2}%`,
              height: `${6 + rand(i * 13 + Math.floor(time * 0.5)) * 4}%`,
              background: `rgba(${warmR},${warmG},${warmB},${0.025 + rand(i * 31) * 0.02})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Vignette — simulates panel darkness at edges away from bleed */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 113 + 29

    let opacity = 0
    let blurPx = 0
    let bleedSpread = 0

    if (phase === 'enter') {
      // Text emerges through the bleed — starts washed out warm, sharpens
      opacity = enterProgress
      // Warm bleed washes out text at start — like backlight overwhelming content
      blurPx = (1 - enterProgress) * 10
      bleedSpread = (1 - enterProgress) * 30
    } else if (phase === 'hold') {
      opacity = 1
      blurPx = 0
      bleedSpread = 0
      // Very subtle IPS shift: text slightly yellowed on hold
    } else {
      opacity = 1 - exitProgress
      blurPx = exitProgress * 8
      bleedSpread = exitProgress * 20
    }

    // Warm halo simulating bleed light drowning the text edges
    const haloOpacity = phase === 'enter' ? (1 - enterProgress) * 0.6
      : phase === 'exit' ? exitProgress * 0.5
      : 0.05 + Math.sin(f * 0.04 + seed) * 0.02

    return (
      <>
        {/* Backlight bleed halo behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color: `rgba(255, 230, 160, ${haloOpacity})`,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 6,
            filter: `blur(${bleedSpread * 0.8}px)`,
            pointerEvents: 'none',
          }}
        >
          {word}
        </div>
        {/* Main text — emerges through the bleed */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 6,
            textShadow: `0 0 ${6 + bleedSpread * 0.4}px rgba(255,220,140,${0.2 + haloOpacity * 0.5}), 0 0 2px rgba(255,255,255,0.1)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function LCDBleedComponent(props: MotionGraphicProps<LCDBleedConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lcd-bleed',
  title: 'Kinetic LCD Bleed',
  description: 'LCD backlight bleeding at panel edges — warm hotspots wash out the text which emerges sharpening through the bleed',
  tags: ['kinetic', 'typography', 'lcd', 'backlight', 'bleed', 'display', 'glitch', 'hardware'],
  category: 'captions',
  component: LCDBleedComponent as any,
  defaultConfig: {
    words: ['BLEED', 'WASH', 'GLOW', 'BURN'],
    colors: ['#e8d8b0', '#f0e8c8', '#ddd0a0', '#ffffff'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BLEED', 'WASH', 'GLOW', 'BURN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8d8b0', '#f0e8c8', '#ddd0a0', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
