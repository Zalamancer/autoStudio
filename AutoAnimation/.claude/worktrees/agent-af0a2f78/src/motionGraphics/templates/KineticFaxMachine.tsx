import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FaxMachineConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const scanY = ((time * 60) % height)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Fax machine body — top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: '12%',
            background: 'linear-gradient(180deg, #d0ccc4 0%, #c8c4bc 60%, #bab6ae 100%)',
            borderRadius: '6px 6px 0 0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          {/* Display panel */}
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '15%',
              width: '30%',
              height: '40%',
              background: '#2a3a1a',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: '#7acc44',
              letterSpacing: 1,
            }}
          >
            RECEIVING...
          </div>
          {/* Status LEDs */}
          <div style={{ position: 'absolute', top: '35%', right: '15%', display: 'flex', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: Math.sin(time * 5) > 0 ? '#44cc44' : '#226622' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#cc4422', opacity: 0.3 }} />
          </div>
        </div>

        {/* Paper output slot */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '12%',
            right: '12%',
            height: 6,
            background: '#1a1a1a',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
          }}
        />

        {/* Thermal fax paper — slightly curled */}
        <div
          style={{
            position: 'absolute',
            top: '13%',
            left: '14%',
            right: '14%',
            bottom: '8%',
            background: 'linear-gradient(90deg, #eae6de 0%, #ede9e2 5%, #f0ece6 50%, #ede9e2 95%, #e8e4dc 100%)',
            boxShadow: '2px 3px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Thermal paper grain */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.006) 1px, rgba(0,0,0,0.006) 2px)',
            }}
          />

          {/* Scan line artifacts — horizontal bands */}
          {Array.from({ length: 6 }, (_, i) => {
            const lineY = (scanY + i * 80) % height
            return (
              <div
                key={`artifact-${i}`}
                style={{
                  position: 'absolute',
                  top: lineY,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `rgba(0,0,0,${0.03 + Math.random() * 0.02})`,
                }}
              />
            )
          })}

          {/* Fax header line */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '5%',
              right: '5%',
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'Courier New', monospace",
              fontSize: 7,
              color: 'rgba(0,0,0,0.15)',
            }}
          >
            <span>FROM: +1-555-0100</span>
            <span>03/19/2026 12:00</span>
            <span>P.1/1</span>
          </div>
        </div>

        {/* Paper curl at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '6%',
            left: '14%',
            right: '14%',
            height: 20,
            background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.03))',
            borderRadius: '0 0 8px 8px',
          }}
        />
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
    fps,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / (fps ?? 30)

    let opacity = 0
    let scanReveal = 0
    let artifactIntensity = 0

    if (phase === 'enter') {
      // Horizontal scan line reveals text left to right
      scanReveal = enterProgress
      opacity = Math.min(1, enterProgress * 1.8)
      artifactIntensity = (1 - enterProgress) * 0.6
    } else if (phase === 'hold') {
      scanReveal = 1
      opacity = 1
      artifactIntensity = 0.05
    } else {
      scanReveal = 1
      opacity = 1 - exitProgress * 0.9
      artifactIntensity = exitProgress * 0.3
    }

    // Clip mask width based on scan reveal
    const clipPercent = scanReveal * 100

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
        {/* Scan line indicator */}
        {phase === 'enter' && scanReveal < 1 && (
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              bottom: '-20%',
              left: `${clipPercent}%`,
              width: 2,
              background: 'rgba(0,180,0,0.25)',
              boxShadow: '0 0 8px rgba(0,180,0,0.15)',
              zIndex: 20,
            }}
          />
        )}

        {/* Fax text with clip reveal */}
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(28px, 7.5vw, 82px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            // Low resolution fax appearance
            textShadow: `0.5px 0 0 ${color}30, -0.5px 0 0 ${color}20`,
            clipPath: `inset(0 ${100 - clipPercent}% 0 0)`,
            // Slight thermal blur
            filter: artifactIntensity > 0.1 ? `blur(${artifactIntensity}px)` : 'none',
          }}
        >
          {word}
        </div>

        {/* Horizontal scan artifacts over the text */}
        {artifactIntensity > 0.1 &&
          Array.from({ length: 3 }, (_, i) => (
            <div
              key={`ta-${i}`}
              style={{
                position: 'absolute',
                top: `${20 + i * 30}%`,
                left: 0,
                right: 0,
                height: 1,
                background: `rgba(0,0,0,${artifactIntensity * 0.15})`,
              }}
            />
          ))}
      </div>
    )
  },
}

function FaxMachineComponent(props: MotionGraphicProps<FaxMachineConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fax-machine',
  title: 'Kinetic Fax Machine',
  description:
    'Fax machine scan with text revealed by horizontal scan line on thermal paper, scan artifacts, low-resolution appearance, and paper curl.',
  tags: ['kinetic', 'typography', 'fax', 'scanner', 'thermal', 'office', 'retro', 'paper'],
  category: 'captions',
  component: FaxMachineComponent as any,
  defaultConfig: {
    words: ['SCAN', 'SEND', 'RECV', 'CONF'],
    colors: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'],
    bgColor: '#2a2a2e',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCAN', 'SEND', 'RECV', 'CONF'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a2a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
