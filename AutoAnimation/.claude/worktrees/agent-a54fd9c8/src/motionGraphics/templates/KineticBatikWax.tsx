import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BatikWaxConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// Batik: molten wax drawn with tjanting tool on fabric as resist,
// then fabric dipped in dye. Wax cracks during dyeing — distinctive
// crackle lines fill with dye. When wax is removed, the REVERSE reveals.
// Process: wax-on (clear resist) → dye fills around → wax removed = text appears
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Fabric weave texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 5px),
              repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 5px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Batik dye color variation — uneven dye absorption */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${rand(i * 17) * 80}%`,
              top: `${rand(i * 23) * 80}%`,
              width: `${20 + rand(i * 7) * 30}%`,
              height: `${15 + rand(i * 11) * 25}%`,
              background: `radial-gradient(ellipse, ${bgColor === '#F8F0E0' ? 'rgba(180,130,60,0.06)' : 'rgba(255,255,255,0.04)'} 0%, transparent 70%)`,
              borderRadius: '50%',
            }}
          />
        ))}
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

    // Batik stages:
    // 1. Wax resist drawn — text appears in wax color (cream/yellow)
    // 2. Dye floods the fabric around the wax
    // 3. Wax removed — text revealed in undyed fabric vs dyed bg
    // 4. Exit: dye floods back in (reverse)

    let waxOpacity = 0       // Wax drawing progress
    let dyeProgress = 0      // Dye flooding progress
    let waxRemoved = false   // Whether wax has been boiled off
    let crackProgress = 0   // Crackle line fill progress

    if (phase === 'enter') {
      const t = enterProgress
      if (t < 0.3) {
        // Wax being drawn by tjanting tool
        waxOpacity = t / 0.3
        dyeProgress = 0
        waxRemoved = false
      } else if (t < 0.6) {
        // Dye flooding in
        waxOpacity = 1
        dyeProgress = (t - 0.3) / 0.3
        crackProgress = (t - 0.3) / 0.3
        waxRemoved = false
      } else {
        // Wax removed — true reveal
        const p = (t - 0.6) / 0.4
        waxOpacity = 1 - p
        dyeProgress = 1
        crackProgress = 1
        waxRemoved = p > 0.5
      }
    } else if (phase === 'hold') {
      waxOpacity = 0
      dyeProgress = 1
      crackProgress = 1
      waxRemoved = true
    } else {
      // Re-wax on exit
      waxOpacity = exitProgress
      dyeProgress = 1 - exitProgress * 0.5
      crackProgress = 1 - exitProgress
      waxRemoved = false
    }

    const fontSize = 'clamp(50px, 13vw, 180px)'
    const fontStyle: React.CSSProperties = {
      fontFamily: "'Georgia', 'Palatino', serif",
      fontSize,
      fontWeight: 800,
      letterSpacing: 3,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
    }

    // Wax color (paraffin/beeswax = cream yellow)
    const waxColor = '#F0D890'
    // Final color after wax removed = the undyed fabric showing through
    const revealedColor = '#F5EDD0'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Wax layer — cream/yellow, drawn phase */}
        {waxOpacity > 0.05 && (
          <div
            style={{
              ...fontStyle,
              position: 'absolute',
              top: 0,
              left: 0,
              color: waxColor,
              opacity: waxOpacity * 0.9,
              filter: `blur(${(1 - waxOpacity) * 2}px)`,
              textShadow: `0 0 ${waxOpacity * 8}px rgba(240,220,80,0.4)`,
            }}
          >
            {word}
          </div>
        )}

        {/* Final revealed text (fabric color after wax removed) */}
        {waxRemoved && (
          <div
            style={{
              ...fontStyle,
              position: 'absolute',
              top: 0,
              left: 0,
              color: revealedColor,
              opacity: dyeProgress,
            }}
          >
            {word}
          </div>
        )}

        {/* Dye-phase text (color floods around = we see the inverse) */}
        {!waxRemoved && dyeProgress > 0 && (
          <div
            style={{
              ...fontStyle,
              position: 'absolute',
              top: 0,
              left: 0,
              color: color,
              opacity: dyeProgress * 0.7,
              mixBlendMode: 'multiply',
            }}
          >
            {word}
          </div>
        )}

        {/* Crackle lines overlay — dye seeping through wax cracks */}
        {crackProgress > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: crackProgress * 0.6,
              pointerEvents: 'none',
            }}
          >
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              {Array.from({ length: 12 }, (_, i) => {
                const x1 = rand(i * 11 + 1) * 100
                const y1 = rand(i * 13 + 2) * 100
                const x2 = x1 + (rand(i * 7 + 3) - 0.5) * 40
                const y2 = y1 + (rand(i * 5 + 4) - 0.5) * 40
                return (
                  <line
                    key={i}
                    x1={`${x1}%`} y1={`${y1}%`}
                    x2={`${x2}%`} y2={`${y2}%`}
                    stroke={color}
                    strokeWidth={0.8 + rand(i * 3) * 1.2}
                    opacity={crackProgress * 0.5 * rand(i * 9)}
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>
          </div>
        )}

        {/* Spacer */}
        <div style={{ ...fontStyle, opacity: 0, position: 'relative' }}>{word}</div>
      </div>
    )
  },
}

function BatikWaxComponent(props: MotionGraphicProps<BatikWaxConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-batik-wax',
  title: 'Kinetic Batik Wax',
  description: 'Molten wax resist drawn on fabric, then dye floods in with characteristic crackle lines filling with color, wax melts away to reveal undyed fabric text — authentic batik process animated',
  tags: ['kinetic', 'typography', 'batik', 'wax', 'resist', 'dye', 'craft', 'textile', 'fabric', 'crackle', 'Indonesian'],
  category: 'captions',
  component: BatikWaxComponent as any,
  defaultConfig: {
    words: ['WAX', 'DYE', 'CRACK', 'RESIST'],
    colors: ['#4A1C96', '#0D47A1', '#1B5E20', '#BF360C'],
    bgColor: '#F8F0E0',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAX', 'DYE', 'CRACK', 'RESIST'], group: 'Content' },
    { key: 'colors', label: 'Dye Colors', type: 'text-array', defaultValue: ['#4A1C96', '#0D47A1', '#1B5E20', '#BF360C'], group: 'Style' },
    { key: 'bgColor', label: 'Fabric Color', type: 'color', defaultValue: '#F8F0E0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
