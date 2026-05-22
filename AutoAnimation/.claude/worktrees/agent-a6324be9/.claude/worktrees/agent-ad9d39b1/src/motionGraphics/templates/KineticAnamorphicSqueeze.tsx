import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AnamorphicSqueezeConfig extends KineticBaseConfig {
  squeezeAmount: number
}

// Anamorphic lens simulation — text enters vertically compressed (2.39:1 squeeze),
// unsqueezes to normal at hold, re-squeezes on exit. Horizontal streak artifacts on entry/exit.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Vignette — elliptical, wide, mimics anamorphic oval bokeh */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 120% 70% at 50% 50%, transparent 38%, rgba(0,0,0,0.82) 100%)', pointerEvents: 'none' }} />
      {/* Letterbox bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '7%', background: '#000', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '7%', background: '#000', pointerEvents: 'none' }} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const easeIn  = (t: number) => Math.pow(t, 3)

    let squeeze: number   // 0 = normal, 1 = max vertical squeeze
    let opacity: number
    let scaleX: number
    let scaleY: number

    if (phase === 'enter') {
      const ep = easeOut(enterProgress)
      squeeze = 1 - ep
      opacity = 0.3 + ep * 0.7
      scaleX = 1 + squeeze * 0.22   // anamorphic: horizontally wider when squeezed
      scaleY = 1 - squeeze * 0.50   // compressed to ~50% height at peak
    } else if (phase === 'hold') {
      squeeze = 0; opacity = 1; scaleX = 1; scaleY = 1
    } else {
      const ep = easeIn(exitProgress)
      squeeze = ep
      opacity = 1 - ep * 0.78
      scaleX = 1 + squeeze * 0.22
      scaleY = 1 - squeeze * 0.50
    }

    // Horizontal cyan streak — signature anamorphic lens flare artifact
    const streakOpacity = squeeze * 0.55

    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap' }}>
        {/* Horizontal lens streak */}
        {squeeze > 0.05 && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '180%', height: 2,
            background: `linear-gradient(to right, transparent, rgba(140,210,255,${streakOpacity * 0.5}), rgba(200,235,255,${streakOpacity}), rgba(140,210,255,${streakOpacity * 0.5}), transparent)`,
            filter: 'blur(1px)', pointerEvents: 'none',
          }} />
        )}
        {/* Cyan chromatic ghost */}
        {squeeze > 0.08 && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, -50%) scaleX(${scaleX * 1.014}) scaleY(${scaleY})`,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)', fontWeight: 300,
            color: `rgba(0,200,255,${squeeze * 0.32})`,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            whiteSpace: 'nowrap', mixBlendMode: 'screen',
          }}>{word}</div>
        )}
        {/* Main text */}
        <div style={{
          position: 'relative',
          transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(40px, 10vw, 140px)', fontWeight: 300,
          color, letterSpacing: '0.1em', textTransform: 'uppercase',
          whiteSpace: 'nowrap', opacity,
          textShadow: squeeze < 0.05 ? '0 2px 24px rgba(255,255,255,0.12)' : 'none',
        }}>{word}</div>
      </div>
    )
  },
}

function AnamorphicSqueezeComponent(props: MotionGraphicProps<AnamorphicSqueezeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-anamorphic-squeeze',
  title: 'Kinetic Anamorphic Squeeze',
  description: 'Anamorphic lens simulation: text enters vertically squeezed as if shot on a 2.39:1 anamorphic lens, unsqueezes to sharp hold, exits re-compressed with horizontal lens streak artifacts',
  tags: ['kinetic', 'typography', 'film', 'camera', 'anamorphic', 'lens', 'cinematic', 'squeeze', 'brand'],
  category: 'captions',
  component: AnamorphicSqueezeComponent as any,
  defaultConfig: {
    words: ['ANAMORPHIC', 'CINEMA', 'ULTRA', 'WIDE'],
    colors: ['#FFFFFF', '#E8F4FF', '#D0E8FF', '#F5FAFF'],
    bgColor: '#060810',
    cycleDuration: 1.2,
    squeezeAmount: 50,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ANAMORPHIC', 'CINEMA', 'ULTRA', 'WIDE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#E8F4FF', '#D0E8FF', '#F5FAFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
    { key: 'squeezeAmount', label: 'Squeeze Amount (%)', type: 'number', defaultValue: 50, min: 10, max: 80, group: 'Animation' },
  ],
})
