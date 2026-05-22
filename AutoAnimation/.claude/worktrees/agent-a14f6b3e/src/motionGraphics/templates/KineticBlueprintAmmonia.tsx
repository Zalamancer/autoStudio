import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlueprintAmmoniaConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Blueprint paper — deep Prussian blue */}
        <div
          style={{
            position: 'absolute',
            inset: '4%',
            background: 'linear-gradient(135deg, #0a1a3a 0%, #0d1f42 30%, #0a1838 70%, #081630 100%)',
            borderRadius: 2,
            boxShadow: '3px 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          {/* Diazo process texture — subtle ammonia grain */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: [
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 3px)',
                'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.005) 2px, rgba(255,255,255,0.005) 3px)',
              ].join(', '),
              borderRadius: 2,
            }}
          />

          {/* Grid lines — engineering drafting */}
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={`hline-${i}`}
              style={{
                position: 'absolute',
                top: `${6 + i * 6}%`,
                left: '3%',
                right: '3%',
                height: 1,
                background: 'rgba(120,160,220,0.06)',
              }}
            />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={`vline-${i}`}
              style={{
                position: 'absolute',
                left: `${6 + i * 8}%`,
                top: '3%',
                bottom: '3%',
                width: 1,
                background: 'rgba(120,160,220,0.06)',
              }}
            />
          ))}

          {/* Title block — bottom right engineering standard */}
          <div
            style={{
              position: 'absolute',
              bottom: '3%',
              right: '3%',
              width: '35%',
              height: '12%',
              border: '1px solid rgba(180,210,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 8px',
            }}
          >
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 7,
                color: 'rgba(180,210,255,0.15)',
                letterSpacing: 2,
              }}
            >
              DIAZO REPRODUCTION
            </div>
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 6,
                color: 'rgba(180,210,255,0.1)',
                marginTop: 2,
              }}
            >
              SCALE: 1:1 | REV: A | SHEET 1/1
            </div>
          </div>

          {/* Fold creases — vertical and horizontal */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: 2,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              height: 2,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            }}
          />

          {/* Diagonal fold crease */}
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '25%',
              right: '25%',
              bottom: '25%',
              borderRadius: 0,
              background: 'transparent',
              boxShadow: 'inset 0 0 60px rgba(255,255,255,0.008)',
            }}
          />

          {/* Decorative dimension lines */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '8%',
              width: '25%',
              height: 1,
              background: 'rgba(180,210,255,0.08)',
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: -3, width: 1, height: 7, background: 'rgba(180,210,255,0.08)' }} />
            <div style={{ position: 'absolute', right: 0, top: -3, width: 1, height: 7, background: 'rgba(180,210,255,0.08)' }} />
          </div>

          {/* Circle detail — mechanical drawing element */}
          <div
            style={{
              position: 'absolute',
              top: '20%',
              right: '15%',
              width: 40,
              height: 40,
              border: '1px solid rgba(180,210,255,0.06)',
              borderRadius: '50%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 3,
                height: 3,
                background: 'rgba(180,210,255,0.08)',
                borderRadius: '50%',
              }}
            />
          </div>
        </div>
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
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0

    let opacity = 0
    let lineProgress = 0
    let fuzzyEdge = 0

    if (phase === 'enter') {
      // Diazo exposure — text appears as UV light exposes the paper
      lineProgress = enterProgress
      opacity = Math.min(1, enterProgress * 1.5)
      // Ammonia fuzz: lines are slightly fuzzy as they develop
      fuzzyEdge = (1 - enterProgress) * 1.5
    } else if (phase === 'hold') {
      lineProgress = 1
      opacity = 1
      fuzzyEdge = 0.3
    } else {
      lineProgress = 1
      opacity = 1 - exitProgress * 0.8
      fuzzyEdge = 0.3 + exitProgress * 1.2
    }

    const charsToShow = Math.ceil(lineProgress * word.length)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          zIndex: 10,
        }}
      >
        {/* Blueprint text — white lines on blue */}
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(30px, 8vw, 90px)',
            fontWeight: 400,
            color: 'rgba(200, 220, 255, 0.9)',
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
            // Slightly fuzzy line edges — ammonia diazo characteristic
            textShadow: [
              `0 0 ${fuzzyEdge + 0.5}px rgba(180, 210, 255, 0.6)`,
              `0 0 ${fuzzyEdge * 2 + 1}px rgba(120, 170, 240, 0.2)`,
            ].join(', '),
            // Line quality — slightly rough edges
            WebkitFontSmoothing: 'none' as any,
          }}
        >
          {word.split('').map((ch, ci) => (
            <span
              key={ci}
              style={{
                opacity: ci < charsToShow ? 1 : 0,
                display: 'inline-block',
                // Each character has micro variation in exposure
                filter: ci < charsToShow
                  ? `blur(${fuzzyEdge * (0.8 + Math.sin(ci * 1.3) * 0.2)}px)`
                  : 'none',
              }}
            >
              {ch}
            </span>
          ))}
        </div>

        {/* Underline — engineering annotation style */}
        <div
          style={{
            marginTop: 6,
            height: 1,
            background: 'rgba(180, 210, 255, 0.2)',
            width: `${lineProgress * 100}%`,
            transition: 'width 0.05s linear',
            filter: `blur(${fuzzyEdge * 0.5}px)`,
          }}
        />
      </div>
    )
  },
}

function BlueprintAmmoniaComponent(props: MotionGraphicProps<BlueprintAmmoniaConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blueprint-ammonia',
  title: 'Kinetic Blueprint Ammonia',
  description:
    'Blueprint diazo print with white text on deep Prussian blue, ammonia-process fuzzy line edges, fold creases, engineering grid, title block, and UV exposure reveal.',
  tags: ['kinetic', 'typography', 'blueprint', 'diazo', 'ammonia', 'engineering', 'technical', 'paper'],
  category: 'captions',
  component: BlueprintAmmoniaComponent as any,
  defaultConfig: {
    words: ['PLAN', 'DRAW', 'SPEC', 'REVS'],
    colors: ['#b4d2ff', '#b4d2ff', '#b4d2ff', '#b4d2ff'],
    bgColor: '#060e1e',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PLAN', 'DRAW', 'SPEC', 'REVS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#b4d2ff', '#b4d2ff', '#b4d2ff', '#b4d2ff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060e1e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
