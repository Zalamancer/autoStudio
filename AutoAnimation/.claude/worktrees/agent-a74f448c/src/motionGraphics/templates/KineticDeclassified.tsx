import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DeclassifiedConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Generate pseudo-random redaction bar positions for the manila folder feel
    const bars: { x: number; y: number; w: number }[] = []
    for (let i = 0; i < 12; i++) {
      bars.push({
        x: seededRand(i * 31 + 7) * width * 0.6 + width * 0.1,
        y: seededRand(i * 47 + 13) * height * 0.7 + height * 0.08,
        w: seededRand(i * 73 + 29) * 120 + 40,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Manila paper texture grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at ${30 + Math.sin(time * 0.2) * 5}% ${40 + Math.cos(time * 0.3) * 5}%, rgba(210,180,120,0.15) 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Folder tab at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: width * 0.3,
            width: width * 0.25,
            height: 28,
            background: '#C4A86A',
            borderRadius: '0 0 6px 6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
        {/* Date stamp top right */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 20,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(120,60,30,0.35)',
            letterSpacing: 1,
            transform: 'rotate(-3deg)',
          }}
        >
          DEC 1963 // FILE NO. 7749-B
        </div>
        {/* Background redaction bars (static decoration) */}
        {bars.map((bar, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: bar.x,
              top: bar.y,
              width: bar.w,
              height: 10,
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 1,
            }}
          />
        ))}
        {/* Paper edge shadow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 40px rgba(100,70,30,0.15)',
            pointerEvents: 'none',
          }}
        />
        {/* Corner fold bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 30,
            height: 30,
            background: 'linear-gradient(135deg, transparent 50%, rgba(180,150,100,0.3) 50%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const seed = index * 137 + 41

    // The redaction bar that lifts to reveal text
    let barOpacity = 1
    let barScaleY = 1
    let barTranslateY = 0
    let textOpacity = 0
    let textBlur = 8
    let stampOpacity = 0
    let stampScale = 3
    let stampRotation = -15

    if (phase === 'enter') {
      // Redaction bar lifts, text fades in beneath
      barOpacity = 1 - Math.pow(enterProgress, 0.6)
      barScaleY = 1 - enterProgress * 0.3
      barTranslateY = -enterProgress * 20
      textOpacity = Math.pow(enterProgress, 1.5)
      textBlur = (1 - enterProgress) * 8
    } else if (phase === 'hold') {
      barOpacity = 0
      textOpacity = 1
      textBlur = 0
      // DECLASSIFIED stamp slams down during hold
      if (holdProgress > 0.2) {
        const stampProgress = Math.min(1, (holdProgress - 0.2) / 0.15)
        stampOpacity = stampProgress
        stampScale = 1 + (1 - stampProgress) * 2
        stampRotation = -12 + seededRand(seed) * 4
      }
    } else {
      barOpacity = exitProgress * 0.8
      barScaleY = 0.7 + exitProgress * 0.3
      barTranslateY = -(1 - exitProgress) * 20
      textOpacity = 1 - Math.pow(exitProgress, 1.5)
      textBlur = exitProgress * 6
      stampOpacity = Math.max(0, 1 - exitProgress * 2)
    }

    const textWidth = Math.min(word.length * 60, width * 0.7)

    return (
      <>
        {/* Main revealed text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: textOpacity,
            filter: `blur(${textBlur}px)`,
          }}
        >
          {word}
        </div>

        {/* Black redaction bar overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${barTranslateY}px)) scaleY(${barScaleY})`,
            width: textWidth + 40,
            height: 'clamp(50px, 12vw, 120px)',
            background: '#0a0a0a',
            borderRadius: 2,
            opacity: barOpacity,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        />

        {/* DECLASSIFIED stamp */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${stampRotation}deg) scale(${stampScale})`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(14px, 3.5vw, 36px)',
            fontWeight: 700,
            color: 'rgba(180,30,30,0.7)',
            border: '3px solid rgba(180,30,30,0.7)',
            padding: '4px 16px',
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: stampOpacity,
            whiteSpace: 'nowrap',
          }}
        >
          DECLASSIFIED
        </div>
      </>
    )
  },
}

function DeclassifiedComponent(props: MotionGraphicProps<DeclassifiedConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-declassified',
  title: 'Kinetic Declassified',
  description: 'Declassified document reveal: heavy black redaction bars lift to expose hidden text, manila folder background, date stamps, and DECLASSIFIED stamp slam',
  tags: ['kinetic', 'typography', 'spy', 'classified', 'redacted', 'document', 'intelligence', 'secret'],
  category: 'captions',
  component: DeclassifiedComponent as any,
  defaultConfig: {
    words: ['ALPHA', 'CIPHER', 'GHOST', 'BISHOP'],
    colors: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'],
    bgColor: '#D4C5A0',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ALPHA', 'CIPHER', 'GHOST', 'BISHOP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#D4C5A0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
