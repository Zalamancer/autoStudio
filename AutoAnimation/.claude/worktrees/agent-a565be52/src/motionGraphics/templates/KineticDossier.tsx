import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DossierConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const DOSSIER_LINES = [
  'SUBJECT: ████████████',
  'DOB: ██/██/████',
  'NATIONALITY: ████████',
  'STATUS: ACTIVE',
  'CLEARANCE: TOP SECRET//SCI',
  'HANDLER: ████████',
  'LAST CONTACT: ██/██/████',
  'KNOWN ALIASES: ████, ████',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Manila paper texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(170deg, rgba(210,190,150,0.08) 0%, transparent 30%, rgba(210,190,150,0.05) 70%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Tab divider at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: width * 0.15,
            width: width * 0.18,
            height: 22,
            background: '#C8A870',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 2px 3px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: '#5A4020',
              textAlign: 'center',
              lineHeight: '22px',
              letterSpacing: 2,
              fontWeight: 700,
            }}
          >
            FILE 0091
          </div>
        </div>
        {/* Paper clip top-left */}
        <div
          style={{
            position: 'absolute',
            top: -4,
            left: 30,
            width: 18,
            height: 50,
            borderRadius: '9px 9px 0 0',
            border: '2px solid rgba(160,160,170,0.3)',
            borderBottom: 'none',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 34,
            width: 10,
            height: 36,
            borderRadius: '5px 5px 0 0',
            border: '2px solid rgba(160,160,170,0.25)',
            borderBottom: 'none',
            pointerEvents: 'none',
          }}
        />
        {/* Dossier text lines in background */}
        {DOSSIER_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 60,
              top: 40 + i * 18,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: 'rgba(80,60,30,0.15)',
              whiteSpace: 'pre',
              letterSpacing: 0.5,
            }}
          >
            {line}
          </div>
        ))}
        {/* Surveillance photo corner brackets bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 60,
            height: 60,
            pointerEvents: 'none',
          }}
        >
          {/* Top-left corner */}
          <div
            style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 2, background: 'rgba(100,80,50,0.2)' }}
          />
          <div
            style={{ position: 'absolute', top: 0, left: 0, width: 2, height: 12, background: 'rgba(100,80,50,0.2)' }}
          />
          {/* Top-right corner */}
          <div
            style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 2, background: 'rgba(100,80,50,0.2)' }}
          />
          <div
            style={{ position: 'absolute', top: 0, right: 0, width: 2, height: 12, background: 'rgba(100,80,50,0.2)' }}
          />
          {/* Bottom-left corner */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 12,
              height: 2,
              background: 'rgba(100,80,50,0.2)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 2,
              height: 12,
              background: 'rgba(100,80,50,0.2)',
            }}
          />
          {/* Bottom-right corner */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 12,
              height: 2,
              background: 'rgba(100,80,50,0.2)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 2,
              height: 12,
              background: 'rgba(100,80,50,0.2)',
            }}
          />
          {/* Silhouette placeholder */}
          <div
            style={{
              position: 'absolute',
              inset: 6,
              background: 'rgba(80,60,40,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Courier New', monospace",
              fontSize: 7,
              color: 'rgba(80,60,40,0.15)',
            }}
          >
            PHOTO
          </div>
        </div>
        {/* Aged paper vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 50px rgba(100,70,30,0.12)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 151 + 37
    const totalChars = word.length

    if (phase === 'enter') {
      // Typewriter: characters appear one at a time with slight jitter
      const charsToShow = Math.floor(enterProgress * (totalChars + 1))
      const displayText = word.substring(0, Math.min(charsToShow, totalChars))
      const showCursor = true
      // Typewriter head jitter
      const jitterX = enterProgress < 0.9 ? (seededRand(f + seed) - 0.5) * 1.5 : 0
      const jitterY = enterProgress < 0.9 ? (seededRand(f * 3 + seed) - 0.5) * 0.8 : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${jitterX}px), calc(-50% + ${jitterY}px))`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          {displayText.split('').map((ch, ci) => (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                // Slight uneven ink impression like a real typewriter
                opacity: 0.8 + seededRand(seed + ci * 23) * 0.2,
                transform: `translateY(${(seededRand(seed + ci * 59) - 0.5) * 1.5}px)`,
              }}
            >
              {ch}
            </span>
          ))}
          {showCursor && (
            <span
              style={{
                display: 'inline-block',
                width: 'clamp(12px, 3vw, 26px)',
                height: 'clamp(30px, 7vw, 95px)',
                background: color,
                marginLeft: 2,
                verticalAlign: 'middle',
                opacity: Math.sin(f * 0.2) > 0 ? 0.7 : 0,
              }}
            />
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // CLASSIFIED stamp slams in during hold
      let stampOpacity = 0
      let stampScale = 3
      const stampRotation = -8 + seededRand(seed) * 6

      if (holdProgress > 0.15 && holdProgress < 0.35) {
        const stampP = (holdProgress - 0.15) / 0.2
        stampOpacity = Math.min(1, stampP * 3)
        stampScale = 1 + (1 - Math.min(1, stampP * 2)) * 2
      } else if (holdProgress >= 0.35) {
        stampOpacity = 1
        stampScale = 1
      }

      return (
        <>
          {/* Typed word */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 130px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            {word.split('').map((ch, ci) => (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  opacity: 0.8 + seededRand(seed + ci * 23) * 0.2,
                  transform: `translateY(${(seededRand(seed + ci * 59) - 0.5) * 1.5}px)`,
                }}
              >
                {ch}
              </span>
            ))}
          </div>
          {/* CLASSIFIED stamp */}
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${stampRotation}deg) scale(${stampScale})`,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(16px, 4vw, 40px)',
              fontWeight: 700,
              color: 'rgba(200,40,30,0.75)',
              border: '3px solid rgba(200,40,30,0.75)',
              padding: '3px 14px',
              letterSpacing: 8,
              textTransform: 'uppercase',
              opacity: stampOpacity,
              whiteSpace: 'nowrap',
            }}
          >
            CLASSIFIED
          </div>
        </>
      )
    } else {
      // Exit: text fades with paper shuffle feeling
      const slideX = exitProgress * 20
      const opacity = 1 - Math.pow(exitProgress, 1.2)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${slideX}px), -50%)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function DossierComponent(props: MotionGraphicProps<DossierConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dossier',
  title: 'Kinetic Dossier',
  description:
    'Intelligence dossier: typewriter text on manila paper, CLASSIFIED stamp slam, paper clip, tab divider, surveillance photo corners, redacted background lines',
  tags: ['kinetic', 'typography', 'dossier', 'spy', 'classified', 'typewriter', 'intelligence', 'manila'],
  category: 'captions',
  component: DossierComponent as any,
  defaultConfig: {
    words: ['ASSET', 'EXFIL', 'HANDLER', 'MOLE'],
    colors: ['#2A2010', '#2A2010', '#2A2010', '#2A2010'],
    bgColor: '#D4C5A0',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ASSET', 'EXFIL', 'HANDLER', 'MOLE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#2A2010', '#2A2010', '#2A2010', '#2A2010'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#D4C5A0', group: 'Style' },
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
