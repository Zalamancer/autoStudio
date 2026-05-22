import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GhostFlickerConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0
    // Occasional background flash (lightning)
    const flashCycle = (f % 90)
    const isFlash = flashCycle > 85 && flashCycle < 88
    const flashOpacity = isFlash ? 0.08 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
        {/* Fog layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(f * 0.02) * 15}% ${60 + Math.cos(f * 0.015) * 10}%, rgba(80, 80, 100, 0.15), transparent 70%)`,
          }}
        />
        {/* Lightning flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'white',
            opacity: flashOpacity,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 89 + 31

    // Ghost flicker: random opacity jumps
    const flickerSeed = f * 7 + seed
    const flickerValue = rand(Math.floor(flickerSeed / 3)) // Changes every 3 frames

    let mainOpacity = 0
    let glitchX = 0
    let glitchY = 0
    let blur = 0

    if (phase === 'enter') {
      // Rapid flicker in - alternating visible/invisible
      const flickerRate = Math.floor(enterProgress * 8)
      const isVisible = flickerRate % 2 === 0 || enterProgress > 0.7
      mainOpacity = isVisible ? enterProgress * 0.9 : 0.05
      blur = (1 - enterProgress) * 3
      glitchX = (1 - enterProgress) * (rand(seed + f) - 0.5) * 20
    } else if (phase === 'hold') {
      // Ghostly flicker during hold - mostly visible with random dropouts
      const isDropout = flickerValue < 0.12
      const isBrightFlash = flickerValue > 0.95
      mainOpacity = isDropout ? 0.05 : isBrightFlash ? 1 : 0.6 + Math.sin(holdProgress * Math.PI * 6) * 0.15
      glitchX = isDropout ? (rand(seed + f * 3) - 0.5) * 12 : 0
      glitchY = isDropout ? (rand(seed + f * 5) - 0.5) * 6 : 0
      blur = isDropout ? 2 : 0
    } else {
      // Flicker out - increasing dropout frequency
      const dropoutChance = 0.1 + exitProgress * 0.7
      const isDropout = flickerValue < dropoutChance
      mainOpacity = isDropout ? 0 : (1 - exitProgress) * 0.7
      glitchX = exitProgress * (rand(seed + f) - 0.5) * 30
      blur = exitProgress * 4
    }

    // Ghost duplicate slightly offset
    const ghostOffset = 3 + Math.sin(f * 0.08) * 2

    return (
      <>
        {/* Ghost echo - slightly offset and more transparent */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${ghostOffset}px), calc(-50% + ${ghostOffset * 0.5}px))`,
            opacity: mainOpacity * 0.25,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: '#aaaacc',
            filter: 'blur(3px)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Main ghost text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${glitchX}px), calc(-50% + ${glitchY}px))`,
            opacity: mainOpacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color,
            textShadow: `0 0 15px ${color}, 0 0 40px rgba(150, 150, 200, 0.3), 0 0 80px rgba(100, 100, 180, 0.1)`,
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function GhostFlickerComponent(props: MotionGraphicProps<GhostFlickerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ghost-flicker',
  title: 'Kinetic Ghost Flicker',
  description: 'Ghostly text that flickers in and out with random dropouts, lightning flashes, eerie fog, supernatural horror vibe',
  tags: ['kinetic', 'typography', 'horror', 'ghost', 'flicker', 'creepy', 'supernatural', 'dark'],
  category: 'captions',
  component: GhostFlickerComponent as any,
  defaultConfig: {
    words: ['HAUNT', 'SPIRIT', 'WRAITH', 'SHADE'],
    colors: ['#9999CC', '#AAAADD', '#8888BB', '#7777AA'],
    bgColor: '#06060f',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HAUNT', 'SPIRIT', 'WRAITH', 'SHADE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#9999CC', '#AAAADD', '#8888BB', '#7777AA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06060f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
