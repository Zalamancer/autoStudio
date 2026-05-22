import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GreenScreenConfig extends KineticBaseConfig {}

const MAINFRAME_LINES = [
  'VM/370 ONLINE',
  'LOGON OPERATOR',
  'ICH70001I OPERATOR LAST ACCESS 03/19/76 08:42:15',
  'READY; T=0.01/0.02',
  '',
  'CP QUERY VIRTUAL STORAGE',
  'STORAGE = 16M',
  '',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Slow phosphor scan beam
    const scanY = (time * 25) % (height + 40)

    // Character cell grid
    const cellW = 10
    const cellH = 16
    const gridCols = Math.floor(width / cellW)
    const gridRows = Math.floor(height / cellH)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Mainframe text in background */}
        {MAINFRAME_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 14,
              top: 10 + i * 15,
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 10,
              color: '#33AA33',
              opacity: 0.1,
              whiteSpace: 'pre',
              letterSpacing: 1,
            }}
          >
            {line}
          </div>
        ))}

        {/* Character cell grid (subtle) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(90deg, rgba(51,170,51,0.015) 0px, rgba(51,170,51,0.015) 1px, transparent 1px, transparent ${cellW}px),
              repeating-linear-gradient(0deg, rgba(51,170,51,0.015) 0px, rgba(51,170,51,0.015) 1px, transparent 1px, transparent ${cellH}px)
            `,
            pointerEvents: 'none',
          }}
        />

        {/* Moving scan beam with phosphor decay trail */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: scanY - 20,
            height: 2,
            background: 'rgba(51,255,51,0.12)',
            filter: 'blur(0.5px)',
            pointerEvents: 'none',
          }}
        />
        {/* Phosphor decay ghost trail behind scan beam */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: scanY - 60,
            height: 40,
            background: 'linear-gradient(180deg, transparent, rgba(51,170,51,0.03))',
            pointerEvents: 'none',
          }}
        />

        {/* Deep green phosphor vignette (P1 phosphor tube) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,10,0,0.5) 80%, rgba(0,0,0,0.7) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Screen curvature inner shadow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,30,0,0.2)',
            borderRadius: 12,
            pointerEvents: 'none',
          }}
        />

        {/* Very fine scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Determine if amber or green mode based on color
    const isAmber = color.toLowerCase().includes('ff') && color.toLowerCase().includes('aa')

    if (phase === 'enter') {
      // Slow phosphor glow-in: characters appear with phosphor warm-up
      const totalChars = word.length
      const charsToShow = Math.floor(enterProgress * (totalChars + 1))

      const chars = word.split('').map((ch, ci) => {
        if (ci >= charsToShow) return null
        // Each character has phosphor warm-up: dim -> bright
        const charAge = (charsToShow - ci) / totalChars
        const phosphorBrightness = Math.min(1, charAge * 2)
        const ghostOpacity = Math.max(0, 1 - charAge * 3) * 0.3

        return (
          <span key={ci} style={{ position: 'relative', display: 'inline-block' }}>
            {/* Phosphor ghost (decay trail) */}
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                color,
                opacity: ghostOpacity,
                filter: 'blur(2px)',
              }}
            >
              {ch}
            </span>
            {/* Main character */}
            <span
              style={{
                color,
                opacity: phosphorBrightness,
                textShadow: `0 0 ${phosphorBrightness * 6}px ${color}`,
              }}
            >
              {ch}
            </span>
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
          {/* Underscore cursor */}
          <span
            style={{
              color,
              opacity: Math.sin(f * 0.12) > 0 ? 0.9 : 0.1,
              textShadow: `0 0 4px ${color}`,
            }}
          >
            _
          </span>
        </div>
      )
    } else if (phase === 'hold') {
      // Phosphor glow with slow decay shimmer
      const phosphorDecay = Math.sin(f * 0.02) * 0.08
      const glowIntensity = 6 + Math.sin(f * 0.035) * 2

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            opacity: 0.92 + phosphorDecay,
            textShadow: `0 0 ${glowIntensity}px ${color}, 0 0 ${glowIntensity * 2}px ${color}30`,
          }}
        >
          {word}
          {/* Steady underscore cursor */}
          <span
            style={{
              opacity: Math.sin(f * 0.12) > 0 ? 0.9 : 0.1,
            }}
          >
            _
          </span>
        </div>
      )
    } else {
      // Exit: phosphor decay/ghosting - text fades slowly with afterimage
      const decayProgress = exitProgress
      const ghostBlur = decayProgress * 4
      const mainOpacity = Math.max(0, 1 - decayProgress * 1.5)
      const ghostOpacity = Math.max(0, 1 - decayProgress * 0.8) * 0.4

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Phosphor ghost (lingers after main text fades) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(36px, 9vw, 130px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              opacity: ghostOpacity,
              filter: `blur(${ghostBlur}px)`,
              textShadow: `0 0 12px ${color}`,
            }}
          >
            {word}
          </div>
          {/* Main text */}
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(36px, 9vw, 130px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              opacity: mainOpacity,
              textShadow: `0 0 6px ${color}`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function GreenScreenComponent(props: MotionGraphicProps<GreenScreenConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-green-screen',
  title: 'Kinetic Green Screen',
  description:
    'Green/amber phosphor P1 CRT terminal with slow phosphor decay ghosting, character-cell grid, scan beam trail, mainframe era aesthetic, and warm-up glow',
  tags: ['kinetic', 'typography', 'greenscreen', 'phosphor', 'crt', 'mainframe', 'terminal', 'retro', 'computing'],
  category: 'captions',
  component: GreenScreenComponent as any,
  defaultConfig: {
    words: ['LOGIN', 'QUERY', 'EXEC', 'HALT'],
    colors: ['#33FF33', '#33FF33', '#33FF33', '#33FF33'],
    bgColor: '#001a00',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LOGIN', 'QUERY', 'EXEC', 'HALT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#33FF33', '#33FF33', '#33FF33', '#33FF33'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#001a00', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
