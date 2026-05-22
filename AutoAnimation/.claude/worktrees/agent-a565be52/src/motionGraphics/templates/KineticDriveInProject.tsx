import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DriveInProjectConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Projector beam flicker — deterministic sine-based pattern
    const beamFlicker = 0.7 + 0.15 * Math.sin(time * 47.3) + 0.1 * Math.sin(time * 113.7) + 0.05 * Math.sin(time * 239.1)
    // Dust motes in beam — slow horizontal drift
    const dustY1 = ((time * 3.1) % 1) * 100
    const dustY2 = ((time * 2.3 + 0.4) % 1) * 100
    const dustY3 = ((time * 1.7 + 0.7) % 1) * 100

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Night sky gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #0a0a1a 0%, #0d0d22 60%, #1a1008 100%)',
          }}
        />
        {/* Projector beam — wide cone from top-right */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: '10%',
            width: 0,
            height: 0,
            borderLeft: '180px solid transparent',
            borderRight: '60px solid transparent',
            borderTop: `120px solid rgba(255, 245, 200, ${0.08 * beamFlicker})`,
            filter: 'blur(8px)',
            transformOrigin: 'top right',
            transform: 'scaleY(8)',
          }}
        />
        {/* Beam core — brighter center */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: '15%',
            width: 0,
            height: 0,
            borderLeft: '80px solid transparent',
            borderRight: '20px solid transparent',
            borderTop: `100px solid rgba(255, 250, 220, ${0.06 * beamFlicker})`,
            filter: 'blur(4px)',
            transformOrigin: 'top right',
            transform: 'scaleY(8)',
          }}
        />
        {/* Dust motes in beam */}
        {[dustY1, dustY2, dustY3].map((y, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              right: `${14 + i * 4 + (time * (i + 1) * 11.3) % 5}%`,
              top: `${y}%`,
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: `rgba(255,245,200,${0.4 * beamFlicker})`,
            }}
          />
        ))}
        {/* Screen frame — white border representing the outdoor screen */}
        <div
          style={{
            position: 'absolute',
            inset: '8% 12%',
            border: '3px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 0 40px rgba(255,245,200,0.03)',
          }}
        />
        {/* Screen texture — slight grain */}
        <div
          style={{
            position: 'absolute',
            inset: '8% 12%',
            backgroundImage: 'radial-gradient(ellipse at 30% 40%, rgba(255,245,180,0.04) 0%, transparent 60%)',
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 24

    // Projector beam on: text resolves from bright overexposed white → correct color
    let opacity = 0
    let brightness = 1
    let blurPx = 0
    let scale = 1

    if (phase === 'enter') {
      // First 30%: beam flickers on — rapid opacity pulses
      if (enterProgress < 0.3) {
        const flicker = Math.abs(Math.sin(enterProgress * 120))
        opacity = flicker * (enterProgress / 0.3)
        brightness = 3 - enterProgress * 3
        blurPx = (1 - enterProgress / 0.3) * 6
      } else {
        // Resolve: overexposed → normal
        const resolveP = (enterProgress - 0.3) / 0.7
        opacity = 1
        brightness = 3 - resolveP * 2  // 3 → 1
        blurPx = (1 - resolveP) * 2
        scale = 1 + (1 - resolveP) * 0.04
      }
    } else if (phase === 'hold') {
      opacity = 1
      brightness = 1
      // Subtle projector wobble
      const wobble = Math.sin(f * 0.8) * 0.003
      scale = 1 + wobble
    } else {
      opacity = 1 - exitProgress
      brightness = 1
    }

    // Warm sepia color for the text glow
    const flickerVal = 0.85 + 0.1 * Math.sin(time * 43.7) + 0.05 * Math.sin(time * 97.3)

    return (
      <>
        {/* Projected glow behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale * 1.1})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color: `rgba(255,245,180,${opacity * 0.3 * flickerVal})`,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 6,
            filter: `blur(12px) brightness(${brightness})`,
          }}
        >
          {word}
        </div>
        {/* Main projected text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 6,
            filter: `blur(${blurPx}px) brightness(${brightness})`,
            textShadow: `0 0 30px rgba(255,245,180,${0.4 * opacity * flickerVal}), 0 0 60px rgba(255,240,160,${0.2 * opacity})`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function DriveInProjectComponent(props: MotionGraphicProps<DriveInProjectConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-drive-in-project',
  title: 'Kinetic Drive-In Projector',
  description: 'Drive-in movie projector beam flickers on, text resolves from overexposed white through warm beam light onto outdoor screen',
  tags: ['kinetic', 'typography', 'drive-in', 'projector', 'cinema', 'film', 'beam', 'vintage'],
  category: 'captions',
  component: DriveInProjectComponent as any,
  defaultConfig: {
    words: ['FEATURE', 'FILM', 'TONIGHT'],
    colors: ['#fff8e8', '#ffe8b0', '#fff8e8'],
    bgColor: '#0a0a1a',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FEATURE', 'FILM', 'TONIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#fff8e8', '#ffe8b0', '#fff8e8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 6, group: 'Timing' },
  ],
})
