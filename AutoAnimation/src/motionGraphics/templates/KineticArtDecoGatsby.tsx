import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Era Aesthetic: Art Deco Gatsby Revival (1920s trending in 2025)
// Deep midnight navy with gold geometric ornament. Words enter
// from center outward — expanding from a single point like a
// sunburst opening. Geometric Deco corner ornament lines animate in.
// Hold: word is flanked by symmetric chevron decorations.
// Exit: collapse back to a point.

interface ArtDecoGatsbyConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slow rotation of geometric pattern
    const rot = time * 2

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#0a0f1e'
            ? 'linear-gradient(180deg, #0a0f1e 0%, #0f1628 50%, #0a0f1e 100%)'
            : bgColor,
        }}
      >
        {/* Art Deco geometric grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'repeating-linear-gradient(0deg, rgba(200,160,40,0.05) 0px, rgba(200,160,40,0.05) 1px, transparent 1px, transparent 50px)',
              'repeating-linear-gradient(90deg, rgba(200,160,40,0.05) 0px, rgba(200,160,40,0.05) 1px, transparent 1px, transparent 50px)',
            ].join(', '),
            pointerEvents: 'none',
          }}
        />
        {/* Geometric corner ornaments */}
        {[
          { top: '5%', left: '5%', rotate: 0 },
          { top: '5%', right: '5%', rotate: 90 },
          { bottom: '5%', left: '5%', rotate: 270 },
          { bottom: '5%', right: '5%', rotate: 180 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos as any,
              width: 'clamp(20px, 5%, 50px)',
              height: 'clamp(20px, 5%, 50px)',
              borderTop: '1.5px solid rgba(200,160,40,0.4)',
              borderLeft: '1.5px solid rgba(200,160,40,0.4)',
              transform: `rotate(${pos.rotate}deg)`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let clipX = 100

    if (phase === 'enter') {
      // Sunburst expand from center point
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = Math.min(enterProgress / 0.2, 1)
      scale = eased
      clipX = 0
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      clipX = 0
    } else {
      // Collapse back to point
      const eased = Math.pow(exitProgress, 2)
      opacity = 1 - eased
      scale = 1 - eased
    }

    // Chevron decorations animate in during hold
    const chevronOpacity = phase === 'hold'
      ? Math.min(holdProgress * 3, 1) * 0.8
      : phase === 'exit'
        ? (1 - exitProgress) * 0.8
        : 0
    const chevronWidth = phase === 'hold'
      ? Math.min(holdProgress * 3, 1) * 50
      : phase === 'exit'
        ? (1 - exitProgress) * 50
        : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Top chevron ornament */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            opacity: chevronOpacity,
            width: `${chevronWidth}%`,
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, height: 1, background: color, opacity: 0.6 }} />
          <div style={{ fontFamily: 'serif', fontSize: 'clamp(8px, 2vw, 20px)', color, opacity: 0.8 }}>◆</div>
          <div style={{ flex: 1, height: 1, background: color, opacity: 0.6 }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {/* Left chevron */}
          <div
            style={{
              fontFamily: 'serif',
              fontSize: 'clamp(14px, 3.5vw, 50px)',
              color,
              opacity: chevronOpacity,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            ❮❮
          </div>

          <div
            style={{
              fontFamily: "'Garamond', 'Didot', 'Bodoni MT', 'Georgia', serif",
              fontSize: 'clamp(30px, 7.5vw, 105px)',
              fontWeight: 400,
              letterSpacing: 16,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              color,
              textShadow: `0 0 20px ${color}44`,
            }}
          >
            {word}
          </div>

          {/* Right chevron */}
          <div
            style={{
              fontFamily: 'serif',
              fontSize: 'clamp(14px, 3.5vw, 50px)',
              color,
              opacity: chevronOpacity,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            ❯❯
          </div>
        </div>

        {/* Bottom ornament rule */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            opacity: chevronOpacity,
            width: `${chevronWidth}%`,
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, height: 1, background: color, opacity: 0.6 }} />
          <div style={{ fontFamily: 'serif', fontSize: 'clamp(8px, 2vw, 20px)', color, opacity: 0.8 }}>◆</div>
          <div style={{ flex: 1, height: 1, background: color, opacity: 0.6 }} />
        </div>
      </div>
    )
  },
}

function ArtDecoGatsbyComponent(props: MotionGraphicProps<ArtDecoGatsbyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-art-deco-gatsby',
  title: 'Kinetic Art Deco Gatsby',
  description: '1920s Art Deco revival — sunburst scale-in, gold chevron ornaments, geometric corner accents, midnight navy',
  tags: ['kinetic', 'typography', 'art-deco', 'gatsby', '1920s', 'gold', 'geometric', 'era'],
  category: 'captions',
  component: ArtDecoGatsbyComponent as any,
  defaultConfig: {
    words: ['GATSBY', 'OPULENCE', 'SOIREE', 'GILDED'],
    colors: ['#c8a028', '#e0b830', '#c8a028', '#e0b830'],
    bgColor: '#0a0f1e',
    cycleDuration: 1.7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GATSBY', 'OPULENCE', 'SOIREE', 'GILDED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#c8a028', '#e0b830', '#c8a028', '#e0b830'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0f1e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.7, min: 0.5, max: 5, group: 'Timing' },
  ],
})
