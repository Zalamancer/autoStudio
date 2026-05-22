import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProjectorMisalignConfig extends KineticBaseConfig {
  misalignPx: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Projector throw — slight screen hotspot
    const hotspot = 0.08 + Math.sin(time * 0.3) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Projector screen hotspot — lens throw center is brighter */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 48%, rgba(255,255,220,${hotspot}) 0%, transparent 55%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Vignette — projector edge falloff */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Faint dust specs — projector lens artifacts */}
        {[0.18, 0.42, 0.67, 0.81, 0.29, 0.55].map((t, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(t * 100 + Math.sin(time * 0.05 + i) * 0.5) % 100}%`,
              top: `${((t * 73 + i * 17) % 100 + Math.cos(time * 0.04 + i) * 0.3) % 100}%`,
              width: 1 + (i % 2),
              height: 1 + (i % 2),
              borderRadius: '50%',
              background: `rgba(255,255,200,${0.04 + (i % 3) * 0.02})`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const seed = index * 89 + 17

    // RGB projector lens misalignment converging to sharp text
    // Red, Green, Blue channels start far apart, converge as "technician" adjusts
    let redOffX = 0, redOffY = 0
    let blueOffX = 0, blueOffY = 0
    let greenOffX = 0, greenOffY = 0
    let masterOpacity = 1

    if (phase === 'enter') {
      // Channels start maximally separated, converge
      const spread = (1 - enterProgress) * (12 + (seed % 6))

      // Red shifts left/up, blue right/down — classic projector fringing
      redOffX = -spread * 1.8
      redOffY = -spread * 0.6
      blueOffX = spread * 1.6
      blueOffY = spread * 0.8
      // Green is the "base" channel — least separated
      greenOffX = -spread * 0.3
      greenOffY = spread * 0.5

      masterOpacity = 0.3 + enterProgress * 0.7
    } else if (phase === 'hold') {
      // Perfectly aligned — but projectors drift: add micro-wobble
      const drift = Math.sin(holdProgress * Math.PI * 2 + seed) * 0.4
      redOffX = -drift * 0.3
      blueOffX = drift * 0.3
      masterOpacity = 1
    } else {
      // Misalignment returns on exit — channels separate again
      const spread = exitProgress * 10
      redOffX = -spread * 1.4
      blueOffX = spread * 1.2
      greenOffX = spread * 0.4
      masterOpacity = 1 - exitProgress * 0.8
    }

    const base = {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize: 'clamp(40px, 11vw, 160px)',
      fontWeight: 900,
      whiteSpace: 'nowrap' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 6,
      mixBlendMode: 'screen' as const,
    }

    return (
      <div style={{ opacity: masterOpacity }}>
        {/* Red projector channel */}
        <div
          style={{
            ...base,
            transform: `translate(calc(-50% + ${redOffX}px), calc(-50% + ${redOffY}px))`,
            color: `rgba(255, 30, 30, 0.85)`,
          }}
        >
          {word}
        </div>
        {/* Green projector channel */}
        <div
          style={{
            ...base,
            transform: `translate(calc(-50% + ${greenOffX}px), calc(-50% + ${greenOffY}px))`,
            color: `rgba(30, 255, 30, 0.85)`,
          }}
        >
          {word}
        </div>
        {/* Blue projector channel */}
        <div
          style={{
            ...base,
            transform: `translate(calc(-50% + ${blueOffX}px), calc(-50% + ${blueOffY}px))`,
            color: `rgba(30, 80, 255, 0.85)`,
          }}
        >
          {word}
        </div>
        {/* White composite — visible when channels converge */}
        <div
          style={{
            ...base,
            transform: `translate(-50%, -50%)`,
            color,
            opacity: phase === 'enter' ? enterProgress * enterProgress : phase === 'exit' ? 1 - exitProgress : 1,
            mixBlendMode: 'normal',
            textShadow: `0 0 6px rgba(255,255,255,0.15)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ProjectorMisalignComponent(props: MotionGraphicProps<ProjectorMisalignConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-projector-misalign',
  title: 'Kinetic Projector Misalign',
  description: 'RGB projector channel misalignment — red, green, and blue lenses start separated and converge into sharp composite text',
  tags: ['kinetic', 'typography', 'projector', 'rgb', 'misalign', 'display', 'glitch', 'hardware'],
  category: 'captions',
  component: ProjectorMisalignComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'ALIGN', 'LOCK', 'SHARP'],
    colors: ['#ffffff', '#f0f0f0', '#ffffff', '#e8e8ff'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
    misalignPx: 18,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'ALIGN', 'LOCK', 'SHARP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#f0f0f0', '#ffffff', '#e8e8ff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'misalignPx', label: 'Max Misalignment (px)', type: 'number', defaultValue: 18, min: 4, max: 40, group: 'Animation' },
  ],
})
