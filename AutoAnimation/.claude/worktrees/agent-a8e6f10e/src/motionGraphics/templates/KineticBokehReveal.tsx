import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BokehRevealConfig extends KineticBaseConfig {
  bokehCount: number
}

// Bokeh reveal: text emerges from a field of out-of-focus circular light blobs
// (bokeh = Japanese for blur/haze). As the virtual lens focuses, bokeh circles
// shrink to points and text sharpens from beneath them.

// Deterministic bokeh positions — consistent per render
const BOKEH_DATA = [
  { x: 15, y: 25, r: 38, bright: 0.7, hue: 40 },
  { x: 72, y: 18, r: 52, bright: 0.5, hue: 200 },
  { x: 85, y: 65, r: 44, bright: 0.6, hue: 30 },
  { x: 28, y: 78, r: 36, bright: 0.55, hue: 220 },
  { x: 55, y: 88, r: 28, bright: 0.4, hue: 50 },
  { x: 92, y: 35, r: 32, bright: 0.45, hue: 10 },
  { x: 8, y: 55, r: 46, bright: 0.6, hue: 190 },
  { x: 48, y: 12, r: 24, bright: 0.35, hue: 35 },
  { x: 63, y: 45, r: 56, bright: 0.3, hue: 210 },
  { x: 35, y: 42, r: 20, bright: 0.5, hue: 25 },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, enterProgress, holdProgress, exitProgress }: BackgroundRenderProps) => {
    const time = frame / fps
    // Bokeh scale: large during unfocused state, shrinks as focus lands
    const ep = enterProgress ?? 0
    const xp = exitProgress ?? 0
    const hp = holdProgress ?? 0

    const focusProgress = hp > 0 ? 1 : ep
    const defocusProgress = xp
    const bokehScale = hp > 0
      ? Math.max(0.05, 1 - defocusProgress * 0.95)   // shrink out on exit
      : Math.max(0.05, 1 - focusProgress * 0.95)      // shrink in on enter

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Bokeh circles */}
        {BOKEH_DATA.map((b, i) => {
          // Gentle drift — deterministic oscillation
          const driftX = Math.sin(time * 0.4 + i * 1.1) * 1.5
          const driftY = Math.cos(time * 0.3 + i * 0.9) * 1.2
          const currentR = b.r * bokehScale
          const opacity = b.bright * Math.max(0.05, bokehScale * 1.1)

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${b.x + driftX}%`,
                top: `${b.y + driftY}%`,
                width: `${currentR * 2}px`,
                height: `${currentR * 2}px`,
                marginLeft: `-${currentR}px`,
                marginTop: `-${currentR}px`,
                borderRadius: '50%',
                // Classic bokeh: bright ring + soft fill — simulates lens aperture disc
                background: `radial-gradient(circle, rgba(255,255,255,${opacity * 0.3}) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,${opacity * 0.5}) 80%, rgba(255,255,255,${opacity * 0.3}) 100%)`,
                boxShadow: `0 0 ${currentR * 0.8}px ${currentR * 0.3}px rgba(255, ${200 + b.hue}, ${100 + b.hue * 0.5}, ${opacity * 0.4})`,
                filter: `blur(${currentR * 0.15}px)`,
                pointerEvents: 'none',
              }}
            />
          )
        })}

        {/* Defocus haze behind bokeh */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    let blur: number
    let opacity: number
    let scale: number

    if (phase === 'enter') {
      const ep = easeOut(enterProgress)
      blur = (1 - ep) * 20
      opacity = 0.2 + ep * 0.8
      scale = 1 + (1 - ep) * 0.08
    } else if (phase === 'hold') {
      blur = 0
      opacity = 1
      scale = 1
    } else {
      const ep = easeOut(exitProgress)
      blur = ep * 18
      opacity = 1 - ep * 0.85
      scale = 1 + ep * 0.06
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          whiteSpace: 'nowrap',
        }}
      >
        {/* Warm bokeh glow behind text */}
        <div
          style={{
            position: 'absolute',
            inset: '-10%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(255,210,100,0.6)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            filter: `blur(${blur + 12}px)`,
            opacity: opacity * 0.5,
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
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            filter: blur > 0.2 ? `blur(${blur}px)` : 'none',
            opacity,
            textShadow: blur < 1 ? `0 0 30px rgba(255,210,120,0.4), 0 2px 8px rgba(0,0,0,0.6)` : 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function BokehRevealComponent(props: MotionGraphicProps<BokehRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bokeh-reveal',
  title: 'Kinetic Bokeh Reveal',
  description: 'Text emerges from a field of out-of-focus bokeh light circles that shrink as the lens focuses — warm cinematic depth-of-field effect',
  tags: ['kinetic', 'typography', 'film', 'camera', 'bokeh', 'depth of field', 'focus', 'cinematic', 'lens'],
  category: 'captions',
  component: BokehRevealComponent as any,
  defaultConfig: {
    words: ['BOKEH', 'DEPTH', 'HAZE', 'FOCUS'],
    colors: ['#F5E6C8', '#FFD080', '#FFFFFF', '#F0D890'],
    bgColor: '#060408',
    cycleDuration: 1.5,
    bokehCount: 10,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOKEH', 'DEPTH', 'HAZE', 'FOCUS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E6C8', '#FFD080', '#FFFFFF', '#F0D890'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060408', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'bokehCount', label: 'Bokeh Count', type: 'number', defaultValue: 10, min: 4, max: 20, group: 'Animation' },
  ],
})
