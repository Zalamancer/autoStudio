import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BenDayZoomConfig extends KineticBaseConfig {}

// Ben-Day dots zoom in — Roy Lichtenstein pop-art halftone aesthetic
// Large CMYK-style dots zoom from screen-filling to normal background,
// text appears through the halftone pattern as dots shrink to reveal it

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Pulsing dot size for animated screentone feel
    const pulse = 1 + Math.sin(time * 3) * 0.06
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Large primary Ben-Day dot layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.22) ${3 * pulse}px, transparent ${3 * pulse}px)`,
            backgroundSize: `${14 * pulse}px ${14 * pulse}px`,
          }}
        />
        {/* Secondary color dot layer (cyan/blue tint) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(0,100,200,0.1) 2px, transparent 2px)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '10px 10px',
          }}
        />
        {/* Thin grid lines — printing registration feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '28px 28px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 61 + 3

    let dotSize = 30
    let textOpacity = 0
    let textScale = 1
    let containerOpacity = 1

    if (phase === 'enter') {
      // Dots zoom from huge (full screen) to normal size, revealing text underneath
      const zoomT = enterProgress
      // Big dots shrink as they zoom in
      dotSize = 30 - zoomT * 20  // 30px -> 10px
      textOpacity = Math.max(0, (zoomT - 0.4) / 0.6)
      textScale = 0.8 + zoomT * 0.2
      containerOpacity = Math.min(1, zoomT * 2)
    } else if (phase === 'hold') {
      dotSize = 10
      textOpacity = 1
      textScale = 1
      containerOpacity = 1
    } else {
      // Reverse: dots grow back, swallowing text
      const outT = exitProgress
      dotSize = 10 + outT * 25
      textOpacity = Math.max(0, 1 - outT * 2)
      textScale = 1 + outT * 0.15
      containerOpacity = 1 - outT * 0.8
    }

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
        {/* Text */}
        <div
          style={{
            position: 'relative',
            transform: `scale(${textScale})`,
            transformOrigin: 'center center',
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(48px, 12vw, 160px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: color,
              WebkitTextStroke: '3px #000000',
              textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              userSelect: 'none',
            }}
          >
            {word}
          </div>

          {/* Ben-Day dot overlay ON the text — halftone fill effect */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.12) ${dotSize * 0.18}px, transparent ${dotSize * 0.18}px)`,
              backgroundSize: `${dotSize * 0.55}px ${dotSize * 0.55}px`,
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
              borderRadius: 2,
            }}
          />
        </div>

        {/* Zooming dot overlay behind text — the main visual effect */}
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            left: '-30%',
            width: '160%',
            height: '180%',
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.18) ${dotSize * 0.22}px, transparent ${dotSize * 0.22}px)`,
            backgroundSize: `${dotSize}px ${dotSize}px`,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
            opacity: 0.7,
          }}
        />
      </div>
    )
  },
}

function BenDayZoomComponent(props: MotionGraphicProps<BenDayZoomConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ben-day-zoom',
  title: 'Kinetic Ben-Day Zoom',
  description: 'Roy Lichtenstein pop-art Ben-Day dots zoom from screen-filling down to fine halftone, revealing text through the shrinking dot pattern — CMYK printing aesthetic',
  tags: ['kinetic', 'typography', 'comic', 'ben-day', 'halftone', 'pop-art', 'lichtenstein', 'dots', 'zoom'],
  category: 'captions',
  component: BenDayZoomComponent as any,
  defaultConfig: {
    words: ['OH!', 'WOW!', 'YES!', 'NO!'],
    colors: ['#FF0000', '#0000FF', '#FF6600', '#CC0099'],
    bgColor: '#FFFF00',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OH!', 'WOW!', 'YES!', 'NO!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF0000', '#0000FF', '#FF6600', '#CC0099'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFF00', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.4, max: 5, group: 'Timing' },
  ],
})
