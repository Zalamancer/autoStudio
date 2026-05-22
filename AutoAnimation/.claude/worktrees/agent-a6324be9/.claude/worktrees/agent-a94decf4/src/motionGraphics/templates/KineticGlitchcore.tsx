import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GlitchcoreConfig extends KineticBaseConfig {}

const SLICE_COUNT = 10

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const scanY = (time * 50) % 100
    const scan2Y = ((time * 37 + 30) % 100)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dense scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.015) 1px, rgba(255,255,255,0.015) 2px)',
            pointerEvents: 'none',
          }}
        />
        {/* Moving scan bar 1 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scanY}%`,
            height: 3,
            background: 'rgba(255,0,128,0.12)',
            pointerEvents: 'none',
          }}
        />
        {/* Moving scan bar 2 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scan2Y}%`,
            height: 2,
            background: 'rgba(0,255,128,0.08)',
            pointerEvents: 'none',
          }}
        />
        {/* Data corruption blocks */}
        {Array.from({ length: 4 }, (_, i) => {
          const blockSeed = i * 173 + 59
          const blockTime = (time * 3 + i * 1.5) % 5
          const visible = blockTime < 0.3
          if (!visible) return null
          const y = ((blockSeed * 7) % 80) + 5
          const h = 3 + (blockSeed % 8)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${y}%`,
                height: h,
                background: `rgba(${(blockSeed * 3) % 255}, ${(blockSeed * 7) % 255}, ${(blockSeed * 11) % 255}, 0.08)`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const seed = index * 131 + 47
    const f = frame ?? 0
    let globalOpacity = 0

    if (phase === 'enter') {
      globalOpacity = Math.min(enterProgress / 0.2, 1)
    } else if (phase === 'hold') {
      globalOpacity = 1
    } else {
      globalOpacity = 1 - exitProgress
    }

    // Generate horizontal slices with independent RGB offsets
    const slices = Array.from({ length: SLICE_COUNT }, (_, i) => {
      const sliceTop = (i / SLICE_COUNT) * 100
      const sliceHeight = 100 / SLICE_COUNT

      // Per-slice horizontal offset
      let xOffset = 0
      let rgbR = 0
      let rgbB = 0

      if (phase === 'enter') {
        // During enter, slices converge from random positions
        const sliceSeed = seed + i * 53
        const sliceDelay = (i / SLICE_COUNT) * 0.6
        const sliceProgress = Math.max(0, Math.min(1, (enterProgress - sliceDelay) / (1 - sliceDelay)))
        xOffset = (1 - sliceProgress) * (((sliceSeed % 2 === 0) ? 1 : -1) * (10 + (sliceSeed % 30)))
        rgbR = (1 - sliceProgress) * (3 + (sliceSeed % 4))
        rgbB = (1 - sliceProgress) * (3 + ((sliceSeed + 2) % 4))
      } else if (phase === 'hold') {
        // Periodic glitch bursts
        const glitchCycle = (f * 0.1 + i * 0.7) % 8
        if (glitchCycle < 0.5) {
          const sliceSeed = seed + i * 53
          xOffset = ((sliceSeed % 2 === 0) ? 1 : -1) * (4 + (sliceSeed % 8))
          rgbR = 2 + (sliceSeed % 3)
          rgbB = 2 + ((sliceSeed + 1) % 3)
        }
      } else {
        // Exit: slices scatter
        const sliceSeed = seed + i * 53
        xOffset = exitProgress * ((sliceSeed % 2 === 0) ? 1 : -1) * (15 + (sliceSeed % 20))
        rgbR = exitProgress * 5
        rgbB = exitProgress * 5
      }

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${sliceTop}%`,
            left: 0,
            right: 0,
            height: `${sliceHeight}%`,
            overflow: 'hidden',
          }}
        >
          {/* Red channel */}
          <div
            style={{
              position: 'absolute',
              top: `-${sliceTop}%`,
              left: 0,
              right: 0,
              height: `${SLICE_COUNT * 100}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateX(${xOffset - rgbR}px)`,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 11vw, 160px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 4,
                color: 'rgba(255,0,50,0.4)',
                whiteSpace: 'nowrap',
                mixBlendMode: 'screen',
              }}
            >
              {word}
            </span>
          </div>
          {/* Blue channel */}
          <div
            style={{
              position: 'absolute',
              top: `-${sliceTop}%`,
              left: 0,
              right: 0,
              height: `${SLICE_COUNT * 100}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateX(${xOffset + rgbB}px)`,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 11vw, 160px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 4,
                color: 'rgba(0,80,255,0.4)',
                whiteSpace: 'nowrap',
                mixBlendMode: 'screen',
              }}
            >
              {word}
            </span>
          </div>
          {/* Main text */}
          <div
            style={{
              position: 'absolute',
              top: `-${sliceTop}%`,
              left: 0,
              right: 0,
              height: `${SLICE_COUNT * 100}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateX(${xOffset}px)`,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 11vw, 160px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 4,
                color,
                textShadow: `0 0 6px ${color}`,
                whiteSpace: 'nowrap',
              }}
            >
              {word}
            </span>
          </div>
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: globalOpacity }}>
        {slices}
      </div>
    )
  },
}

function GlitchcoreComponent(props: MotionGraphicProps<GlitchcoreConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-glitchcore',
  title: 'Kinetic Glitchcore',
  description: 'Extreme glitch aesthetic with 10 horizontal slices, independent RGB shifts, data corruption, and scan lines',
  tags: ['kinetic', 'typography', 'glitchcore', 'glitch', 'extreme', 'digital', 'aesthetic'],
  category: 'captions',
  component: GlitchcoreComponent as any,
  defaultConfig: {
    words: ['BREAK', 'DATA', 'VOID', 'CORE'],
    colors: ['#ffffff', '#FF00FF', '#00FFFF', '#ffffff'],
    bgColor: '#050505',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREAK', 'DATA', 'VOID', 'CORE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#FF00FF', '#00FFFF', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
