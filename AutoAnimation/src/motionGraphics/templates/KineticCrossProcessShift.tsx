import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrossProcessShiftConfig extends KineticBaseConfig {
  xproIntensity: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Cross-processing: slide film in print chemistry (E-6 in C-41 or vice versa)
    // Results: greens become electric, shadows go cyan/blue, highlights yellow-green
    // Very high contrast, over-saturated, color cast dependent on film type

    const shift = Math.sin(time * 0.3) * 0.05

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Electric green shadow cast — Velvia in C-41 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 30% 70%, rgba(0,${180 + shift * 200},60,0.15) 0%, transparent 60%)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        {/* Cyan-blue shadow corner */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 75% 25%, rgba(30,80,${200 + shift * 100},0.12) 0%, transparent 55%)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        {/* Yellow-green highlight push */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 40%, rgba(${200 + shift * 100},255,20,0.08) 0%, transparent 45%)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        {/* Cross-process contrast crunch */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Vertical banding — chemistry uneven development */}
        {[0.15, 0.35, 0.55, 0.75, 0.92].map((x, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x * 100}%`,
              top: 0,
              bottom: 0,
              width: 2 + (i % 2),
              background: `rgba(${i % 2 === 0 ? '0,200,100' : '30,60,200'},${0.025 + Math.sin(time * 0.2 + i) * 0.01})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Halide grain — E-6 in C-41 creates large clumpy grain */}
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={`g-${i}`}
            style={{
              position: 'absolute',
              left: `${((i * 37 + Math.floor(time * 18) * 13) % 97) / 97 * 100}%`,
              top: `${((i * 53 + Math.floor(time * 18) * 7) % 89) / 89 * 100}%`,
              width: 2 + (i % 3),
              height: 2 + (i % 2),
              background: `rgba(${i % 3 === 0 ? '0,255,80' : i % 3 === 1 ? '40,80,255' : '255,255,0'},0.07)`,
              borderRadius: '50%',
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
    let hueShift = 0

    if (phase === 'enter') {
      const ease = 1 - Math.pow(1 - enterProgress, 2)
      opacity = ease
      scale = 0.9 + ease * 0.1
      hueShift = (1 - ease) * 90 // starts with massive hue shift
    } else if (phase === 'hold') {
      // Slow xpro hue drift
      hueShift = Math.sin(t * 0.6 + index) * 15
      scale = 1 + Math.sin(t * 0.8 + index) * 0.005
    } else {
      opacity = 1 - Math.pow(exitProgress, 2)
      hueShift = exitProgress * 60
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: `hue-rotate(${hueShift}deg) saturate(2.2) contrast(1.3)`,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 4,
          textShadow: '0 0 20px rgba(0,255,100,0.4), 0 0 40px rgba(30,80,255,0.2)',
        }}
      >
        {word}
      </div>
    )
  },
}

function CrossProcessShiftComponent(props: MotionGraphicProps<CrossProcessShiftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cross-process-shift',
  title: 'Kinetic Cross Process Shift',
  description: 'E-6 slide film in C-41 print chemistry — electric greens, cyan shadows, yellow-green highlights, massive hue shift entry, vertical banding from uneven chemistry',
  tags: ['kinetic', 'typography', 'cross process', 'xpro', 'film', 'color', 'analog', 'saturated', 'electric'],
  category: 'captions',
  component: CrossProcessShiftComponent as any,
  defaultConfig: {
    words: ['VIVID', 'XPRO', 'SHIFT', 'WARP'],
    colors: ['#00FF80', '#40FFAA', '#00FF80', '#CCFF00'],
    bgColor: '#050a08',
    cycleDuration: 1.4,
    xproIntensity: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VIVID', 'XPRO', 'SHIFT', 'WARP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF80', '#40FFAA', '#00FF80', '#CCFF00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050a08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'xproIntensity', label: 'XPro Intensity', type: 'number', defaultValue: 80, min: 20, max: 150, group: 'Animation' },
  ],
})
