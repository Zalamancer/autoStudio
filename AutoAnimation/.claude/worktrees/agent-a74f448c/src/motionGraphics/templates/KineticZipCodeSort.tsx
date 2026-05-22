import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZipCodeSortConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const beltW = width * 0.85
    const beltH = height * 0.12

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Industrial facility ceiling — overhead pipes & lights */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '15%',
            background: 'linear-gradient(180deg, #1a1a1e 0%, #222228 100%)',
          }}
        >
          {/* Fluorescent tube light */}
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              left: '20%',
              right: '20%',
              height: 6,
              background: `rgba(255,250,230,${0.5 + Math.sin(time * 8) * 0.05})`,
              borderRadius: 3,
              boxShadow: `0 4px 20px rgba(255,250,200,${0.15 + Math.sin(time * 8) * 0.03})`,
            }}
          />
        </div>
        {/* Conveyor belt — moves continuously */}
        <div
          style={{
            position: 'absolute',
            top: '65%',
            left: '50%',
            width: beltW,
            height: beltH,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, #2a2a30 0%, #222228 50%, #1a1a20 100%)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* Belt texture — moving ridges */}
          {Array.from({ length: 20 }, (_, i) => {
            const offset = ((time * 80 + i * (beltW / 20)) % beltW) - beltW * 0.05
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: offset,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: 'rgba(255,255,255,0.04)',
                }}
              />
            )
          })}
          {/* Belt side rails */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#3a3a42' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#3a3a42' }} />
        </div>
        {/* Conveyor rollers visible at ends */}
        {[-1, 1].map((side) => (
          <div
            key={side}
            style={{
              position: 'absolute',
              top: '65%',
              left: side === -1 ? `${50 - (beltW / width) * 50}%` : `${50 + (beltW / width) * 50 - 2}%`,
              width: beltH * 0.8,
              height: beltH,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #555 0%, #333 100%)',
              transform: `rotate(${time * 120}deg)`,
            }}
          />
        ))}
        {/* OCR scanner beam — red laser line */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            width: 3,
            height: '45%',
            transform: 'translateX(-50%)',
            background: `linear-gradient(180deg, rgba(255,50,50,${0.6 + Math.sin(time * 6) * 0.2}), rgba(255,50,50,0.05))`,
            boxShadow: `0 0 12px rgba(255,50,50,${0.3 + Math.sin(time * 6) * 0.1})`,
          }}
        />
        {/* Scanner housing at top */}
        <div
          style={{
            position: 'absolute',
            top: '14%',
            left: '50%',
            width: 40,
            height: 20,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, #444, #333)',
            borderRadius: '4px 4px 0 0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 2,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: `rgba(255,50,50,${0.7 + Math.sin(time * 6) * 0.3})`,
              boxShadow: `0 0 6px rgba(255,50,50,0.5)`,
            }}
          />
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
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let translateX = 0
    let translateY = 0
    const beltY = height * 0.58
    let scanHighlight = 0
    let sprayOpacity = 0
    let sprayWidth = 0

    if (phase === 'enter') {
      if (enterProgress < 0.3) {
        // Envelope slides in from left on conveyor
        const t = enterProgress / 0.3
        translateX = (1 - t) * -width * 0.6
        translateY = 0
        opacity = t
      } else if (enterProgress < 0.6) {
        // Scanner reads — flash of red light
        const t = (enterProgress - 0.3) / 0.3
        translateX = 0
        opacity = 1
        scanHighlight = Math.sin(t * Math.PI) * 0.6
      } else {
        // Orange fluorescent spray mark applied
        const t = (enterProgress - 0.6) / 0.4
        translateX = 0
        opacity = 1
        sprayOpacity = t
        sprayWidth = t * 100
      }
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
      sprayOpacity = 1
      sprayWidth = 100
    } else {
      // Slides out right on conveyor
      translateX = exitProgress * width * 0.6
      opacity = 1 - exitProgress
      sprayOpacity = 1 - exitProgress
      sprayWidth = 100
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: beltY,
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-100% + ${translateY}px))`,
          opacity,
        }}
      >
        {/* Envelope on belt */}
        <div
          style={{
            position: 'relative',
            padding: '12px 28px',
            background: 'linear-gradient(145deg, #f5f0e6, #ece4d4)',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            minWidth: 150,
          }}
        >
          {/* Scanner read highlight */}
          {scanHighlight > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: -4,
                background: `rgba(255,50,50,${scanHighlight * 0.15})`,
                border: `1px solid rgba(255,50,50,${scanHighlight * 0.3})`,
                borderRadius: 4,
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Address text — the word being sorted */}
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(24px, 6vw, 64px)',
              fontWeight: 700,
              color,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              textAlign: 'center',
            }}
          >
            {word}
          </div>
          {/* Faint barcode under text */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              marginTop: 4,
              opacity: 0.15,
            }}
          >
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: i % 3 === 0 ? 3 : 1.5,
                  height: 8,
                  background: '#333',
                }}
              />
            ))}
          </div>
          {/* Orange fluorescent spray mark */}
          {sprayOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: `${sprayWidth}%`,
                height: 8,
                background: `linear-gradient(90deg, transparent, rgba(255,140,0,${sprayOpacity * 0.6}), rgba(255,160,0,${sprayOpacity * 0.8}), rgba(255,140,0,${sprayOpacity * 0.6}), transparent)`,
                filter: 'blur(2px)',
                borderRadius: 4,
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function ZipCodeSortComponent(props: MotionGraphicProps<ZipCodeSortConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zip-code-sort',
  title: 'Kinetic Zip Code Sort',
  description:
    'Mail sorting machine with conveyor belt, OCR scanner laser, and orange fluorescent spray marks. Text on envelope slides through industrial sorting facility.',
  tags: ['kinetic', 'typography', 'zipcode', 'sorting', 'mail', 'conveyor', 'postal', 'OCR', 'industrial'],
  category: 'captions',
  component: ZipCodeSortComponent as any,
  defaultConfig: {
    words: ['SORT', 'SCAN', 'ROUTE', 'SEND'],
    colors: ['#2a2a30', '#2a2a30', '#2a2a30', '#2a2a30'],
    bgColor: '#1e1e24',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SORT', 'SCAN', 'ROUTE', 'SEND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2a2a30', '#2a2a30', '#2a2a30', '#2a2a30'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1e24', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
