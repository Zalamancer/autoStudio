import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ElevatorDisplayConfig extends KineticBaseConfig {
  displayMode: 'led' | 'analog'
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Elevator car interior — brushed stainless steel walls */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #2a2a2a 0%, #1e1e1e 30%, #222 70%, #1a1a1a 100%)',
          }}
        />
        {/* Brushed metal texture — horizontal lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
          }}
        />
        {/* Art Deco panel above the display */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '20%',
            right: '20%',
            height: '18%',
            background: 'linear-gradient(180deg, #3a3225 0%, #2a2418 100%)',
            borderRadius: '4px 4px 0 0',
            border: '1px solid #4a3f30',
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
          }}
        >
          {/* Art Deco fan pattern */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '100%',
              background: 'conic-gradient(from 180deg at 50% 100%, transparent 0deg, rgba(200,170,100,0.06) 20deg, transparent 40deg, rgba(200,170,100,0.06) 60deg, transparent 80deg, rgba(200,170,100,0.06) 100deg, transparent 120deg, rgba(200,170,100,0.06) 140deg, transparent 160deg, rgba(200,170,100,0.06) 180deg)',
              pointerEvents: 'none',
            }}
          />
          {/* Deco gold trim line */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '5%',
              right: '5%',
              height: 2,
              background: 'linear-gradient(90deg, transparent, #C9A94E, transparent)',
            }}
          />
        </div>
        {/* Display housing — dark recessed panel */}
        <div
          style={{
            position: 'absolute',
            top: '26%',
            left: '15%',
            right: '15%',
            height: '48%',
            background: '#0a0a0a',
            borderRadius: 8,
            border: '3px solid #3a3225',
            boxShadow: 'inset 0 2px 15px rgba(0,0,0,0.8), 0 1px 3px rgba(200,170,100,0.1)',
          }}
        />
        {/* Up/Down arrow indicators — left side */}
        <div
          style={{
            position: 'absolute',
            top: '34%',
            left: '6%',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {/* Up arrow */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: `14px solid rgba(0,200,80,${0.3 + Math.sin(time * 2) * 0.15})`,
              filter: `drop-shadow(0 0 4px rgba(0,200,80,${0.2 + Math.sin(time * 2) * 0.1}))`,
            }}
          />
          {/* Down arrow */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '14px solid rgba(200,50,30,0.2)',
            }}
          />
        </div>
        {/* Bottom trim — gold accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '14%',
            left: '15%',
            right: '15%',
            height: 3,
            background: 'linear-gradient(90deg, #3a3225, #C9A94E, #3a3225)',
            borderRadius: 1,
          }}
        />
        {/* Elevator door seam lines */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(0,0,0,0.15)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0

    // Segmented LED display effect
    let displayOpacity = 0
    let segmentBrightness = 0
    let scrollOffset = 0

    if (phase === 'enter') {
      // Segments flicker on — like LED warming up
      const eased = easeOutQuart(enterProgress)
      displayOpacity = eased
      segmentBrightness = eased
      // Scroll up from below
      scrollOffset = (1 - eased) * 30
    } else if (phase === 'hold') {
      displayOpacity = 1
      segmentBrightness = 0.9 + Math.sin(f * 0.05) * 0.1
      scrollOffset = 0
    } else {
      // Scroll up and out
      const eased = easeOutQuart(exitProgress)
      displayOpacity = 1 - eased
      segmentBrightness = 1 - eased
      scrollOffset = -eased * 30
    }

    // "Ding" indicator — bright flash on enter
    const dingFlash = phase === 'enter' && enterProgress > 0.8 && enterProgress < 0.95

    return (
      <div
        style={{
          position: 'absolute',
          top: '46%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${scrollOffset}px)`,
          opacity: displayOpacity,
          textAlign: 'center',
        }}
      >
        {/* Main floor / text display */}
        <div
          style={{
            fontFamily: "'Courier New', 'Share Tech Mono', monospace",
            fontSize: 'clamp(40px, 12vw, 140px)',
            fontWeight: 700,
            color: color,
            letterSpacing: 6,
            textShadow: `0 0 ${8 + segmentBrightness * 12}px ${color}80, 0 0 ${4 + segmentBrightness * 6}px ${color}`,
            lineHeight: 1,
            // Segmented display look
            opacity: segmentBrightness,
          }}
        >
          {word}
        </div>
        {/* Ding flash overlay */}
        {dingFlash && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120%',
              height: '120%',
              background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 60%)`,
              pointerEvents: 'none',
              filter: 'blur(10px)',
            }}
          />
        )}
        {/* Floor direction subtext */}
        <div
          style={{
            marginTop: 8,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(10px, 2vw, 16px)',
            color: `${color}80`,
            letterSpacing: 4,
            opacity: segmentBrightness * 0.6,
            textTransform: 'uppercase',
          }}
        >
          {index % 2 === 0 ? '--- GOING UP ---' : '--- LEVEL ---'}
        </div>
      </div>
    )
  },
}

function ElevatorDisplayComponent(props: MotionGraphicProps<ElevatorDisplayConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-elevator-display',
  title: 'Elevator Floor Display',
  description:
    'Segmented LED elevator floor indicator with up/down arrows, Art Deco panel housing, ding flash transitions, and brushed steel elevator interior. Text scrolls vertically between floors.',
  tags: ['kinetic', 'typography', 'elevator', 'floor', 'display', 'led', 'segment', 'art-deco', 'signage', 'building'],
  category: 'captions',
  component: ElevatorDisplayComponent as any,
  defaultConfig: {
    words: ['LOBBY', 'FLOOR 7', 'ROOF', 'PENTHSE'],
    colors: ['#FF3B30', '#FF9500', '#FF3B30', '#FFD700'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.3,
    displayMode: 'led',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOBBY', 'FLOOR 7', 'ROOF', 'PENTHSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3B30', '#FF9500', '#FF3B30', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'displayMode', label: 'Display Mode', type: 'select', defaultValue: 'led', options: ['led', 'analog'], group: 'Style' },
  ],
})
