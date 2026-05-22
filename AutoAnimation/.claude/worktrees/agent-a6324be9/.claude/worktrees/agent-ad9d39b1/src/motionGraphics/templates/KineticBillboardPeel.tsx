import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BillboardPeelConfig extends KineticBaseConfig {}

const STRIP_COUNT = 8

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Sky gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #c5d8e8 0%, #e8ddd0 60%, #d0c0a8 100%)',
        }}
      />
      {/* Billboard structure */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '8%',
          right: '8%',
          height: '60%',
        }}
      >
        {/* Metal frame */}
        <div
          style={{
            position: 'absolute',
            inset: -6,
            background: 'linear-gradient(180deg, #888, #666, #777)',
            borderRadius: 4,
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          }}
        />
        {/* Billboard panel — plain white base (old poster underneath) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#e8e0d4',
            overflow: 'hidden',
          }}
        >
          {/* Weathered old poster remnants */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.02), rgba(0,0,0,0.02) 40%, transparent 40%, transparent 41%)',
            }}
          />
          {/* Paste/glue drip marks */}
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${20 + i * 15}%`,
                left: `${10 + i * 18}%`,
                width: 3,
                height: `${15 + i * 5}%`,
                background: 'rgba(200,190,170,0.3)',
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      </div>
      {/* Support pole */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          width: 18,
          height: '30%',
          background: 'linear-gradient(90deg, #666, #888, #666)',
          transform: 'translateX(-50%)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const opacity = phase === 'exit' ? 1 - Math.pow(exitProgress, 2) : 1
    const stripWidth = 100 / STRIP_COUNT

    return (
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '8%',
          right: '8%',
          height: '60%',
          overflow: 'hidden',
          opacity,
        }}
      >
        {/* Each strip is a vertical band being pasted / rolled on */}
        {Array.from({ length: STRIP_COUNT }, (_, si) => {
          // Stagger: left strips paste first
          const stripDelay = si * 0.1
          const stripProgress = phase === 'enter'
            ? Math.max(0, Math.min(1, (enterProgress - stripDelay) / 0.5))
            : 1

          // Strip peels down from top: clipPath reveals from top to bottom
          const revealY = stripProgress * 100

          // Curl effect at the pasting edge — only visible during pasting
          const curlAmount = stripProgress > 0 && stripProgress < 1
            ? Math.sin(stripProgress * Math.PI) * 12
            : 0

          // Shadow under the unrolled edge
          const edgeShadow = stripProgress > 0.1 && stripProgress < 0.95
            ? `0 ${2 + curlAmount}px ${4 + curlAmount}px rgba(0,0,0,0.2)`
            : 'none'

          return (
            <div
              key={si}
              style={{
                position: 'absolute',
                top: 0,
                left: `${si * stripWidth}%`,
                width: `${stripWidth + 0.5}%`,
                height: '100%',
                clipPath: `inset(0 0 ${100 - revealY}% 0)`,
                overflow: 'hidden',
              }}
            >
              {/* Strip background — the poster paper */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)`,
                  boxShadow: edgeShadow,
                }}
              />
              {/* Curl highlight at the pasting edge */}
              {curlAmount > 2 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${revealY - 3}%`,
                    height: 6,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          )
        })}

        {/* Text layer on top — revealed by the same strips */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Composite clip: each strip's progress
            clipPath: phase === 'enter'
              ? `inset(0 0 ${Math.max(0, 100 - enterProgress * 130)}% 0)`
              : undefined,
          }}
        >
          <span
            style={{
              fontFamily: "'Helvetica Neue', 'Arial Black', sans-serif",
              fontSize: 'clamp(36px, 10vw, 130px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              letterSpacing: 6,
              whiteSpace: 'nowrap',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function BillboardPeelComponent(props: MotionGraphicProps<BillboardPeelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-billboard-peel',
  title: 'Billboard Poster Paste',
  description:
    'Billboard poster being pasted up in vertical strips, rolling on from left to right. Each strip curls at the edge as it adheres, revealing the text underneath.',
  tags: ['kinetic', 'typography', 'billboard', 'poster', 'paste', 'peel', 'signage', 'outdoor', 'advertising'],
  category: 'captions',
  component: BillboardPeelComponent as any,
  defaultConfig: {
    words: ['COMING SOON', 'NEW SHOW', 'BUY NOW', 'LIMITED'],
    colors: ['#ffffff', '#FFD700', '#FF4444', '#ffffff'],
    bgColor: '#c5d8e8',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COMING SOON', 'NEW SHOW', 'BUY NOW', 'LIMITED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#FFD700', '#FF4444', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#c5d8e8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
