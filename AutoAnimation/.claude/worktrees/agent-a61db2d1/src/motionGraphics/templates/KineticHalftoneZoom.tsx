import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HalftoneZoomConfig extends KineticBaseConfig {}

// Halftone printing zoom: starts with giant coarse dots (like viewing offset printing
// up close) then zooms out — dots shrink to printing resolution — text resolves
// from pixelated blobs into sharp letterforms. The dot grid itself is the animation.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const drift = (time * 2) % 30
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Static fine halftone — represents the "printed" page */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.07) 1.5px, transparent 1.5px)',
            backgroundSize: '10px 10px',
            backgroundPosition: `${drift * 0.3}px ${drift * 0.2}px`,
          }}
        />
        {/* CMYK registration — slight color dot offset mimicking misregistration */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,80,200,0.06) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
            backgroundPosition: `${drift * 0.5 + 6}px ${drift * 0.4 + 3}px`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(200,0,80,0.05) 1px, transparent 1px)',
            backgroundSize: '11px 11px',
            backgroundPosition: `${drift * 0.4 + 2}px ${drift * 0.6 + 5}px`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 47 + 19

    // The zoom: dotSize transitions from huge (32px) to fine (4px)
    // Text opacity goes from 0 (hidden behind blobs) to 1 (resolved)
    let dotSize = 32
    let textOpacity = 0
    let textScale = 1
    let containerOpacity = 1

    if (phase === 'enter') {
      // Ease-out zoom: dots shrink fast at first, slow at end
      const eased = 1 - Math.pow(1 - enterProgress, 2.5)
      dotSize = 32 - eased * 28       // 32 → 4
      textOpacity = Math.max(0, (enterProgress - 0.5) / 0.5)
      textScale = 0.9 + eased * 0.1
      containerOpacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'hold') {
      dotSize = 4
      textOpacity = 1
      textScale = 1
      containerOpacity = 1
    } else {
      // Reverse: dots grow back, de-resolving the text
      const eased = exitProgress * exitProgress
      dotSize = 4 + eased * 28
      textOpacity = Math.max(0, 1 - exitProgress * 2)
      textScale = 1 + exitProgress * 0.1
      containerOpacity = Math.max(0, 1 - exitProgress * 0.8)
    }

    // CMYK-style dot colors — simulate 4-color offset printing
    const cmykColors = [
      `rgba(0,0,0,0.75)`,           // K
      `rgba(0,120,200,0.6)`,         // C
      `rgba(220,0,80,0.5)`,          // M
      `rgba(240,200,0,0.55)`,        // Y
    ]
    const tilt = ((seed % 3) - 1) * 1.5

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${tilt}deg)`,
          opacity: Math.max(0, containerOpacity),
        }}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Text — fully resolved at small dot size */}
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(52px, 13vw, 175px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: color,
              WebkitTextStroke: '3px #000000',
              textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              opacity: textOpacity,
              transform: `scale(${textScale})`,
              transformOrigin: 'center center',
              userSelect: 'none',
            }}
          >
            {word}
          </div>

          {/* Large dot overlay — K plate, main shape */}
          <div
            style={{
              position: 'absolute',
              inset: `-${dotSize * 0.5}px`,
              backgroundImage: `radial-gradient(circle, ${cmykColors[0]} ${dotSize * 0.38}px, transparent ${dotSize * 0.38}px)`,
              backgroundSize: `${dotSize}px ${dotSize}px`,
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
            }}
          />

          {/* C plate — offset */}
          <div
            style={{
              position: 'absolute',
              inset: `-${dotSize * 0.5}px`,
              backgroundImage: `radial-gradient(circle, ${cmykColors[1]} ${dotSize * 0.3}px, transparent ${dotSize * 0.3}px)`,
              backgroundSize: `${dotSize * 1.15}px ${dotSize * 1.15}px`,
              backgroundPosition: `${dotSize * 0.3}px ${dotSize * 0.15}px`,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              opacity: 0.6,
            }}
          />

          {/* M plate — offset differently */}
          <div
            style={{
              position: 'absolute',
              inset: `-${dotSize * 0.5}px`,
              backgroundImage: `radial-gradient(circle, ${cmykColors[2]} ${dotSize * 0.25}px, transparent ${dotSize * 0.25}px)`,
              backgroundSize: `${dotSize * 1.25}px ${dotSize * 1.25}px`,
              backgroundPosition: `${dotSize * 0.6}px ${dotSize * 0.4}px`,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              opacity: 0.5,
            }}
          />
        </div>
      </div>
    )
  },
}

function HalftoneZoomComponent(props: MotionGraphicProps<HalftoneZoomConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-halftone-zoom',
  title: 'Kinetic Halftone Zoom',
  description: 'CMYK offset printing zoom — giant coarse dots shrink to fine halftone as text resolves from indistinct blobs into sharp letterforms, authentic 4-color press registration',
  tags: ['kinetic', 'typography', 'comic', 'halftone', 'cmyk', 'printing', 'zoom', 'dots', 'resolution', 'offset-press'],
  category: 'captions',
  component: HalftoneZoomComponent as any,
  defaultConfig: {
    words: ['PRINT!', 'DOT!', 'INK!', 'PRESS!'],
    colors: ['#FF0066', '#0044FF', '#FF9900', '#000000'],
    bgColor: '#FFF8F0',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRINT!', 'DOT!', 'INK!', 'PRESS!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF0066', '#0044FF', '#FF9900', '#000000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
