import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BleachBypassDesaturateConfig extends KineticBaseConfig {
  desaturationAmount: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Bleach bypass / skip bleach: silver retention + high contrast desaturated look
    // Used in: Saving Private Ryan, Minority Report, Se7en
    // Extremely crushed blacks, blown highlights, low saturation, high contrast

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          filter: 'saturate(0.15) contrast(1.4)',
          overflow: 'hidden',
        }}
      >
        {/* Silver retention — metallic sheen overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, rgba(200,190,180,0.04) 0%, rgba(160,150,140,0.08) 50%, rgba(220,210,200,0.03) 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Crushed blacks — deep shadows collapse */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,0.7) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Blown highlights — white clipping */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 48% 42%, rgba(255,255,255,${0.05 + Math.sin(time * 0.4) * 0.02}) 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Silver grain texture — coarser than normal film */}
        {Array.from({ length: 16 }, (_, i) => {
          const gx = ((i * 41 + Math.floor(time * 24) * 17) % 97) / 97 * 100
          const gy = ((i * 67 + Math.floor(time * 24) * 11) % 89) / 89 * 100
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${gx}%`,
                top: `${gy}%`,
                width: 1 + (i % 3),
                height: 1 + (i % 2),
                background: `rgba(200,195,190,${0.06 + (i % 4) * 0.02})`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Se7en-style harsh horizontal contrast bands */}
        {[0.3, 0.55, 0.75].map((y, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${y * 100}%`,
              height: 1,
              background: `rgba(0,0,0,${0.08 + i * 0.03})`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      // Harsh snap-in — bleach bypass punches hard
      const snap = Math.min(1, enterProgress * 3)
      opacity = snap
      scale = 1 + (1 - snap) * 0.1
    } else if (phase === 'hold') {
      scale = 1 + Math.sin(t * 0.7 + index) * 0.003
    } else {
      opacity = 1 - Math.pow(exitProgress, 1.5)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: 'saturate(0.2) contrast(1.6)',
          fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(44px, 12vw, 162px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 6,
          // Blown highlight on text — overexposed silver
          textShadow: '0 0 30px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.9)',
        }}
      >
        {word}
      </div>
    )
  },
}

function BleachBypassDesaturateComponent(props: MotionGraphicProps<BleachBypassDesaturateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bleach-bypass-desaturate',
  title: 'Kinetic Bleach Bypass',
  description: 'Skip bleach / bleach bypass desaturated look from Saving Private Ryan and Se7en — silver retention, crushed blacks, blown highlights, heavy contrast, low saturation',
  tags: ['kinetic', 'typography', 'bleach bypass', 'desaturate', 'silver', 'contrast', 'war film', 'noir'],
  category: 'captions',
  component: BleachBypassDesaturateComponent as any,
  defaultConfig: {
    words: ['GRIT', 'WAR', 'STARK', 'BRUTAL'],
    colors: ['#D0C8C0', '#C8C0B8', '#D0C8C0', '#DEDAD4'],
    bgColor: '#080808',
    cycleDuration: 1.3,
    desaturationAmount: 85,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GRIT', 'WAR', 'STARK', 'BRUTAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D0C8C0', '#C8C0B8', '#D0C8C0', '#DEDAD4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
    { key: 'desaturationAmount', label: 'Desaturation %', type: 'number', defaultValue: 85, min: 20, max: 100, group: 'Animation' },
  ],
})
