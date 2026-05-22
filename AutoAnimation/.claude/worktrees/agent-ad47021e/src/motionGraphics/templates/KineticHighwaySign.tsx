import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HighwaySignConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Dashed road lines scrolling toward viewer
    const lineOffset = (time * 200) % 60

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Night sky gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #0a0e1a 0%, #121830 40%, #1a2040 60%, #222 75%, #333 100%)',
          }}
        />
        {/* Road perspective */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '35%',
            background: '#2a2a2a',
            clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
          }}
        >
          {/* Center dashes */}
          {Array.from({ length: 8 }, (_, i) => {
            const yPos = 10 + i * 12 + lineOffset * (0.3 + i * 0.1)
            const dashWidth = 3 + i * 0.8
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: `${yPos % 100}%`,
                  width: dashWidth,
                  height: 12 + i * 2,
                  background: '#FFD700',
                  transform: 'translateX(-50%)',
                  opacity: 0.5 + (i / 8) * 0.5,
                }}
              />
            )
          })}
        </div>
        {/* Sign post supports */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '12%',
            width: 8,
            height: '55%',
            background: 'linear-gradient(90deg, #888, #aaa, #888)',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '12%',
            right: '12%',
            width: 8,
            height: '55%',
            background: 'linear-gradient(90deg, #888, #aaa, #888)',
            borderRadius: 2,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let translateZ = 0

    if (phase === 'enter') {
      // Approaching from distance — zoom in
      const eased = easeOutQuart(enterProgress)
      scale = 0.15 + eased * 0.85
      opacity = Math.min(1, enterProgress * 3)
      translateZ = (1 - eased) * 400
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      // Pass underneath — zoom out above
      const eased = exitProgress * exitProgress
      scale = 1 + eased * 1.5
      opacity = 1 - eased
    }

    const signW = Math.min(width * 0.78, 800)
    const signH = Math.min(height * 0.35, 200)

    return (
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) perspective(800px) translateZ(${translateZ}px)`,
          opacity,
        }}
      >
        {/* Sign panel */}
        <div
          style={{
            position: 'relative',
            width: signW,
            minHeight: signH,
            background: 'linear-gradient(180deg, #006633 0%, #005528 100%)',
            borderRadius: 12,
            border: '4px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 32px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}
        >
          {/* Reflective sheeting grain */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 8,
              background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          {/* Text */}
          <span
            style={{
              position: 'relative',
              fontFamily: "'Highway Gothic', 'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(28px, 8vw, 100px)',
              fontWeight: 700,
              color,
              letterSpacing: 4,
              textTransform: 'uppercase',
              textShadow: '0 0 12px rgba(255,255,255,0.15)',
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </span>
          {/* Route shield */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 16,
              width: 32,
              height: 32,
              background: '#fff',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 12,
              fontWeight: 900,
              color: '#006633',
            }}
          >
            95
          </div>
        </div>
        {/* Distance marker */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 8,
            fontFamily: "'Arial', sans-serif",
            fontSize: 'clamp(12px, 2vw, 18px)',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: 2,
          }}
        >
          EXIT 24 &mdash; 1 MILE
        </div>
      </div>
    )
  },
}

function HighwaySignComponent(props: MotionGraphicProps<HighwaySignConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-highway-sign',
  title: 'Highway Road Sign',
  description:
    'Green highway overhead sign with reflective white text, approaching from the distance like driving at night. Sign zooms in and passes overhead on exit.',
  tags: ['kinetic', 'typography', 'highway', 'road', 'sign', 'wayfinding', 'driving', 'signage'],
  category: 'captions',
  component: HighwaySignComponent as any,
  defaultConfig: {
    words: ['NEW YORK', 'CHICAGO', 'EXIT NOW', 'MERGE'],
    colors: ['#ffffff', '#ffffff', '#ffffff', '#FFD700'],
    bgColor: '#0a0e1a',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEW YORK', 'CHICAGO', 'EXIT NOW', 'MERGE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffffff', '#ffffff', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
