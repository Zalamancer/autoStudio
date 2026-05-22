import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TealOrangeGradeConfig extends KineticBaseConfig {
  gradeStrength: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Teal-Orange grade: Hollywood blockbuster look
    // Shadows pushed teal, highlights pushed orange
    // Complementary split-tone — maximizes skin tone separation
    const tealPulse = 0.15 + Math.sin(time * 0.4) * 0.03
    const orangePulse = 0.18 + Math.cos(time * 0.35) * 0.03

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Teal shadow push — entire shadow range */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(0,${Math.floor(tealPulse * 160)},${Math.floor(tealPulse * 200)},${tealPulse})`,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
        {/* Orange highlight push — warm upper range */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 40%, rgba(255,${Math.floor(140 + orangePulse * 30)},20,${orangePulse}) 0%, transparent 65%)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        {/* Crushed blacks — DI house look */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,15,20,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* CinemaScope horizontal bars — anamorphic framing */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '10%',
            background: 'rgba(0,0,0,0.85)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '10%',
            background: 'rgba(0,0,0,0.85)',
            pointerEvents: 'none',
          }}
        />
        {/* Anamorphic horizontal lens flare streak */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: 1,
            transform: 'translateY(-50%)',
            background: `linear-gradient(to right, transparent 10%, rgba(255,${160},40,${0.04 + Math.sin(time * 2) * 0.02}), transparent 90%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    let opacity = 1
    let scale = 1
    let tealShift = 0

    if (phase === 'enter') {
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      opacity = ease
      scale = 0.92 + ease * 0.08
    } else if (phase === 'hold') {
      scale = 1 + Math.sin(t * 0.6 + index) * 0.004
      // Slight teal-orange oscillation in text glow
      tealShift = Math.sin(t * 0.5) * 5
    } else {
      const ease = Math.pow(exitProgress, 2)
      opacity = 1 - ease
      scale = 1 - ease * 0.04
    }

    const glowTeal = `rgba(0,${160 + tealShift},${180 + tealShift},0.3)`
    const glowOrange = `rgba(255,${140 - tealShift},30,0.3)`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 12,
          // Split tonal glow — teal bottom, orange top
          textShadow: `0 4px 20px ${glowTeal}, 0 -4px 20px ${glowOrange}, 0 0 40px rgba(0,0,0,0.8)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function TealOrangeGradeComponent(props: MotionGraphicProps<TealOrangeGradeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-teal-orange-grade',
  title: 'Kinetic Teal Orange Grade',
  description: 'Hollywood blockbuster teal-orange color grade — shadows pushed teal, highlights pushed warm orange, crushed blacks, CinemaScope bars, and split-tonal text glow',
  tags: ['kinetic', 'typography', 'teal orange', 'color grade', 'hollywood', 'cinematic', 'DI', 'blockbuster'],
  category: 'captions',
  component: TealOrangeGradeComponent as any,
  defaultConfig: {
    words: ['EPIC', 'GRADE', 'BLOCK', 'BUSTER'],
    colors: ['#FF8C40', '#FFB060', '#FF8C40', '#FFAA50'],
    bgColor: '#0a1418',
    cycleDuration: 1.5,
    gradeStrength: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EPIC', 'GRADE', 'BLOCK', 'BUSTER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF8C40', '#FFB060', '#FF8C40', '#FFAA50'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1418', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'gradeStrength', label: 'Grade Strength', type: 'number', defaultValue: 80, min: 20, max: 150, group: 'Animation' },
  ],
})
