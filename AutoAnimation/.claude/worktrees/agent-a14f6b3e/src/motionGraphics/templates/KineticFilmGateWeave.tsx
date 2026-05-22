import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmGateWeaveConfig extends KineticBaseConfig {
  weaveAmount: number
}

function rand(s: number): number {
  const x = Math.sin(s * 91.3 + 217.5) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Gate weave: film slipping in the projector gate — mechanical registration error
    const weaveX = Math.sin(time * 7.3) * 1.2 + Math.sin(time * 13.1) * 0.5
    const weaveY = Math.cos(time * 5.7) * 0.8 + Math.cos(time * 9.3) * 0.4

    // Film scratch — random vertical line
    const scratchPos = rand(Math.floor(time * 4)) * 100

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          transform: `translate(${weaveX}px, ${weaveY}px)`,
          overflow: 'hidden',
        }}
      >
        {/* Frame border — film aperture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '3px solid rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        />
        {/* Film burn corners */}
        {[
          { top: 0, left: 0, transform: 'none' },
          { top: 0, right: 0, transform: 'none' },
          { bottom: 0, left: 0, transform: 'none' },
          { bottom: 0, right: 0, transform: 'none' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              width: 40,
              height: 40,
              background: `rgba(0,0,0,${0.2 + rand(frame * 0.3 + i) * 0.1})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Vertical scratch line — random per-cycle */}
        {rand(Math.floor(time * 3)) > 0.65 && (
          <div
            style={{
              position: 'absolute',
              left: `${scratchPos}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: `rgba(255,255,255,${0.05 + rand(frame * 7) * 0.08})`,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Horizontal splice line — occasional */}
        {rand(Math.floor(time * 2) + 100) > 0.8 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${rand(Math.floor(time * 2) + 200) * 100}%`,
              height: 2,
              background: `rgba(255,255,255,${0.06 + rand(frame * 11) * 0.06})`,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Sprocket holes */}
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={`l-${i}`}
            style={{
              position: 'absolute',
              left: 6,
              top: `${10 + i * (80 / 4)}%`,
              width: 10,
              height: 15,
              borderRadius: 2,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={`r-${i}`}
            style={{
              position: 'absolute',
              right: 6,
              top: `${10 + i * (80 / 4)}%`,
              width: 10,
              height: 15,
              borderRadius: 2,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Film grain */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`g-${i}`}
            style={{
              position: 'absolute',
              left: `${rand(frame * 5 + i * 37) * 100}%`,
              top: `${rand(frame * 7 + i * 53) * 100}%`,
              width: 2,
              height: 3,
              background: rand(frame * 3 + i * 11) > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
              borderRadius: 1,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Gate weave motion — high-frequency mechanical jitter
    const weaveX = Math.sin(t * 7.3 + index * 2.1) * 1.5 + Math.sin(t * 13.7 + index) * 0.6
    const weaveY = Math.cos(t * 5.7 + index * 1.4) * 0.9 + Math.cos(t * 9.3) * 0.4

    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      // Flicker in — projector lamp warming up
      const flicker = Math.floor(enterProgress * 5) / 5
      opacity = flicker > 0.4 ? 1 : enterProgress * 2
      scale = 0.98 + enterProgress * 0.02
    } else if (phase === 'hold') {
      opacity = 1
      // Occasional brightness flicker — lamp instability
      if (rand(f * 17) > 0.92) opacity = 0.7 + rand(f * 23) * 0.3
    } else {
      opacity = 1 - exitProgress * 0.9
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${weaveX}px), calc(-50% + ${weaveY}px)) scale(${scale})`,
          opacity,
          fontFamily: "'Courier New', 'Courier', monospace",
          fontSize: 'clamp(42px, 11vw, 150px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 4,
          textShadow: '0 1px 4px rgba(0,0,0,0.7)',
        }}
      >
        {word}
      </div>
    )
  },
}

function FilmGateWeaveComponent(props: MotionGraphicProps<FilmGateWeaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-film-gate-weave',
  title: 'Kinetic Film Gate Weave',
  description: 'Mechanical film registration error — sprocket holes, gate weave jitter, random scratches, splice lines, and lamp flicker on a textured film frame',
  tags: ['kinetic', 'typography', 'film', 'gate', 'weave', 'jitter', 'projector', 'scratch', 'analog'],
  category: 'captions',
  component: FilmGateWeaveComponent as any,
  defaultConfig: {
    words: ['REEL', 'FRAME', 'SPLICE', 'GATE'],
    colors: ['#F5F5DC', '#FFFFF0', '#F5F5DC', '#FFF8DC'],
    bgColor: '#1a1208',
    cycleDuration: 1.3,
    weaveAmount: 15,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REEL', 'FRAME', 'SPLICE', 'GATE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5F5DC', '#FFFFF0', '#F5F5DC', '#FFF8DC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1208', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
    { key: 'weaveAmount', label: 'Weave Amount (px)', type: 'number', defaultValue: 15, min: 3, max: 40, group: 'Animation' },
  ],
})
