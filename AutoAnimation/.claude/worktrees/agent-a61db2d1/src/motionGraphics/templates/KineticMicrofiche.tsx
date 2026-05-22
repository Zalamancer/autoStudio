import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MicroficheConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const glow = 0.9 + Math.sin(time * 6) * 0.03

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Viewer screen — bright backlit area */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '5%',
            right: '5%',
            bottom: '5%',
            background: `radial-gradient(ellipse at 50% 50%,
              rgba(220,235,255,${0.1 * glow}) 0%,
              rgba(200,220,250,${0.06 * glow}) 50%,
              rgba(180,200,230,${0.02 * glow}) 100%)`,
            borderRadius: 4,
            border: '2px solid rgba(100,120,150,0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Microfiche grid — tiny document frames */}
          {Array.from({ length: 8 }, (_, row) =>
            Array.from({ length: 6 }, (_, col) => {
              const cellOpacity = 0.04 + Math.sin(time * 0.5 + row + col) * 0.01
              return (
                <div
                  key={`${row}-${col}`}
                  style={{
                    position: 'absolute',
                    top: `${8 + row * 11}%`,
                    left: `${6 + col * 15}%`,
                    width: '12%',
                    height: '9%',
                    border: `1px solid rgba(150,170,200,${cellOpacity})`,
                    borderRadius: 1,
                  }}
                >
                  {/* Tiny text lines inside each frame */}
                  {Array.from({ length: 3 }, (_, l) => (
                    <div
                      key={l}
                      style={{
                        position: 'absolute',
                        top: `${20 + l * 25}%`,
                        left: '10%',
                        right: '10%',
                        height: 1,
                        background: `rgba(80,100,140,${cellOpacity * 1.5})`,
                      }}
                    />
                  ))}
                </div>
              )
            })
          )}
          {/* Scan crosshair / focus indicator */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 60,
              height: 60,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            {/* Horizontal crosshair */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 1,
                background: 'rgba(100,180,255,0.15)',
              }}
            />
            {/* Vertical crosshair */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 1,
                background: 'rgba(100,180,255,0.15)',
              }}
            />
          </div>
        </div>
        {/* Screen bezel shadow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
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
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let scale = 1
    let translateX = 0
    let translateY = 0
    let blur = 0

    if (phase === 'enter') {
      // Zoom-scan to find the word: starts zoomed out and panning, then locks on
      if (enterProgress < 0.5) {
        const scanT = enterProgress / 0.5
        scale = 0.3 + scanT * 0.4
        // Pan across the fiche
        const seed = index * 47 + 13
        translateX = (1 - scanT) * ((seed % 2 === 0) ? 30 : -25)
        translateY = (1 - scanT) * ((seed % 3 === 0) ? 20 : -15)
        opacity = 0.3 + scanT * 0.4
        blur = (1 - scanT) * 3
      } else {
        // Zoom in and focus
        const zoomT = (enterProgress - 0.5) / 0.5
        const eased = 1 - Math.pow(1 - zoomT, 3)
        scale = 0.7 + eased * 0.3
        translateX = 0
        translateY = 0
        opacity = 0.7 + eased * 0.3
        blur = (1 - eased) * 2
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Slight magnification breathing
      scale = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.015
      blur = 0
    } else {
      // Zoom back out
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      scale = 1 - eased * 0.5
      blur = eased * 4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        {/* Magnified document text */}
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(32px, 9vw, 120px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            textTransform: 'uppercase',
            textShadow: `0 0 8px rgba(150,200,255,0.15)`,
          }}
        >
          {word}
        </div>
        {/* Magnification lens border highlight */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '140%',
            height: '200%',
            transform: 'translate(-50%, -50%)',
            borderRadius: 8,
            border: '1px solid rgba(100,180,255,0.08)',
            boxShadow: `inset 0 0 30px rgba(100,180,255,0.04)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },
}

function MicroficheComponent(props: MotionGraphicProps<MicroficheConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-microfiche',
  title: 'Kinetic Microfiche',
  description:
    'Microfiche viewer with backlit screen and document grid. Camera pans across tiny frames then zooms in to magnify and focus on the target word.',
  tags: ['kinetic', 'typography', 'microfiche', 'library', 'archive', 'analog', 'zoom', 'research'],
  category: 'captions',
  component: MicroficheComponent as any,
  defaultConfig: {
    words: ['ARCHIVE', 'RECORD', 'SEARCH', 'FOUND'],
    colors: ['#1a2a40', '#1a2a40', '#1a2a40', '#1a2a40'],
    bgColor: '#0c1018',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ARCHIVE', 'RECORD', 'SEARCH', 'FOUND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a2a40', '#1a2a40', '#1a2a40', '#1a2a40'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1018', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
