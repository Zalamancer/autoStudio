import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VHSPauseConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // VHS pause produces multiple horizontal displacement bands
    const numBands = 12
    const bands: { y: number; h: number; shift: number; opacity: number }[] = []
    for (let i = 0; i < numBands; i++) {
      const bandSeed = i * 17 + Math.floor(time * 8)
      const y = rand(i * 3.1) * 100
      const h = 1 + rand(i * 5.7 + 1) * 3
      const shift = (rand(bandSeed) - 0.5) * 18
      const opacity = 0.15 + rand(i * 2.3 + bandSeed) * 0.35
      bands.push({ y, h, shift, opacity })
    }

    // Pause freeze bar — thick white band that floats
    const freezeBarY = ((time * 3) % 110) - 5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.025) 2px, rgba(255,255,255,0.025) 4px)',
            pointerEvents: 'none',
          }}
        />
        {/* Horizontal displacement bands */}
        {bands.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${b.y}%`,
              height: `${b.h}%`,
              background: `rgba(255,255,255,${b.opacity})`,
              transform: `translateX(${b.shift}px)`,
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* VHS pause freeze bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${freezeBarY}%`,
            height: 6,
            background: 'linear-gradient(0deg, transparent, rgba(255,255,255,0.6), rgba(200,220,255,0.4), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* Luma noise at top/bottom (tape edge damage) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 8,
            background: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.12) 4px, rgba(255,255,255,0.12) 8px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 8,
            background: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.12) 4px, rgba(255,255,255,0.12) 8px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 113 + 47

    let opacity = 1
    let mainShiftX = 0
    let mainShiftY = 0

    if (phase === 'enter') {
      // Appear through bands: text slides in from a horizontal displacement burst
      opacity = enterProgress
      mainShiftX = (1 - enterProgress) * (rand(seed) > 0.5 ? 30 : -30)
      mainShiftY = (1 - enterProgress) * ((rand(seed + 1) - 0.5) * 10)
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle periodic jitter from freeze-frame instability
      const jitterPhase = Math.sin(f * 0.4 + seed) * Math.cos(f * 0.7 + seed * 2)
      mainShiftX = jitterPhase * 1.5
    } else {
      opacity = 1 - exitProgress
      // Exit: smear out horizontally like a paused tape being ejected
      mainShiftX = exitProgress * (rand(seed + 2) > 0.5 ? 25 : -25)
    }

    // Luma displacement bands on the text itself during enter/exit
    const numSlices = 6
    const slices = Array.from({ length: numSlices }, (_, i) => {
      const sliceSeed = i * 31 + seed + Math.floor(f * 0.3)
      const sliceY = (i / numSlices) * 100
      const sliceH = 100 / numSlices
      const dispIntensity = phase === 'enter'
        ? (1 - enterProgress) * 20
        : phase === 'exit'
          ? exitProgress * 20
          : Math.abs(Math.sin(f * 0.25 + sliceSeed)) * 2
      const dispX = (rand(sliceSeed) - 0.5) * 2 * dispIntensity
      return { sliceY, sliceH, dispX }
    })

    const fontSize = 'clamp(40px, 11vw, 160px)'
    const fontStyle: React.CSSProperties = {
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize,
      fontWeight: 900,
      color,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: 2,
    }

    return (
      <>
        {/* Sliced displacement layers */}
        {slices.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${mainShiftX + s.dispX}px), calc(-50% + ${mainShiftY}px))`,
              opacity,
              clipPath: `inset(${s.sliceY}% 0 ${100 - s.sliceY - s.sliceH}% 0)`,
              ...fontStyle,
            }}
          >
            {word}
          </div>
        ))}
        {/* Cyan ghost offset — chroma bleed from VHS pause */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${mainShiftX + 3}px), calc(-50% + ${mainShiftY + 1}px))`,
            opacity: opacity * 0.35,
            color: 'rgba(0,255,220,1)',
            mixBlendMode: 'screen',
            ...fontStyle,
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${mainShiftX}px), calc(-50% + ${mainShiftY}px))`,
            opacity,
            textShadow: `0 0 6px rgba(255,255,255,0.3)`,
            ...fontStyle,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function VHSPauseComponent(props: MotionGraphicProps<VHSPauseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vhs-pause',
  title: 'Kinetic VHS Pause',
  description: 'VHS pause distortion with horizontal displacement bands, luma freeze bar, chroma bleed, and tape-edge damage',
  tags: ['kinetic', 'typography', 'vhs', 'pause', 'glitch', 'hardware', 'retro', 'analog'],
  category: 'captions',
  component: VHSPauseComponent as any,
  defaultConfig: {
    words: ['FREEZE', 'PAUSE', 'HOLD', 'STILL'],
    colors: ['#ffffff', '#e0e0ff', '#ffffff', '#ffe0e0'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FREEZE', 'PAUSE', 'HOLD', 'STILL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#e0e0ff', '#ffffff', '#ffe0e0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
