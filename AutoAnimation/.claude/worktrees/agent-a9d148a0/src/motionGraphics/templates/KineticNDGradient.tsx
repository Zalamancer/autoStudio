import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NDGradientConfig extends KineticBaseConfig {
  gradientStrength: number
}

// Graduated neutral density filter (grad ND):
// A screw-on or matte box filter with a dark-to-clear graduation — used to
// balance exposure between a bright sky and darker foreground. Commonly used
// in landscape and fashion cinematography.
// Effect: the top of the frame is darkened (ND density), the bottom is bright.
// Text is revealed from the bright bottom as the ND "wipes" upward — like
// the filter being lifted out of the matte box during a shot.

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, enterProgress, holdProgress, exitProgress }: BackgroundRenderProps) => {
    const ep = (enterProgress as number) ?? 0
    const xp = (exitProgress as number) ?? 0
    const hp = (holdProgress as number) ?? 0

    // ND gradient position — starts fully covering (dark top = 100% of frame),
    // lifts to reveal during enter, holds, closes on exit
    let ndLift: number
    if (hp > 0) {
      ndLift = 1 - xp * 0.9  // closes back down
    } else {
      ndLift = easeOutCubic(ep)
    }

    // The gradient mid-point: 0 = bottom of frame, 1 = above frame (gone)
    const gradMidY = Math.max(5, 95 - ndLift * 90)  // percent from top

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Base exposure — subtle warm-to-cool tonal gradient, mimics daylight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, rgba(20,10,0,0.6) 0%, rgba(80,50,20,0.1) 50%, rgba(180,140,80,0.08) 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* ND gradient overlay — the filter itself */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.6) ${gradMidY * 0.6}%, rgba(0,0,0,0.15) ${gradMidY}%, transparent ${gradMidY + 20}%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Horizon line — the transition zone of the grad ND */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${gradMidY}%`,
            height: 1,
            background: 'rgba(255,220,140,0.06)',
            pointerEvents: 'none',
          }}
        />
        {/* Sky suggestion — faint stars/grain in the dark upper zone */}
        {[
          { x: 15, y: 8 }, { x: 42, y: 12 }, { x: 78, y: 5 },
          { x: 60, y: 15 }, { x: 25, y: 18 }, { x: 88, y: 10 },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: `rgba(255,255,255,${0.2 + (i % 3) * 0.1})`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity: number
    let brightnessVal: number  // text is brighter in the exposed (lower) zone
    let yOffset: number        // text rises from bottom as ND lifts

    if (phase === 'enter') {
      const ep = easeOutCubic(enterProgress)
      opacity = 0.2 + ep * 0.8
      brightnessVal = 0.6 + ep * 0.4
      yOffset = (1 - ep) * 20  // rises up as ND gradient clears
    } else if (phase === 'hold') {
      opacity = 1
      brightnessVal = 1
      yOffset = 0
    } else {
      const ep = easeInCubic(exitProgress)
      opacity = 1 - ep * 0.9
      brightnessVal = 1 - ep * 0.3
      yOffset = ep * -10
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
          whiteSpace: 'nowrap',
          opacity,
          filter: brightnessVal < 0.99 ? `brightness(${brightnessVal})` : 'none',
        }}
      >
        {/* Warm ground-light glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 300,
            color: 'rgba(255,200,100,0.25)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            filter: 'blur(16px)',
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 300,
            color,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            textShadow: `0 0 30px rgba(255,200,100,0.15), 0 2px 8px rgba(0,0,0,0.8)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function NDGradientComponent(props: MotionGraphicProps<NDGradientConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-nd-gradient',
  title: 'Kinetic ND Gradient',
  description: 'Graduated ND filter effect: a dark sky-to-ground density gradient wipes upward to reveal text — mimics the matte box grad ND filter lifted during a cinematic shot',
  tags: ['kinetic', 'typography', 'film', 'camera', 'ND filter', 'graduated', 'neutral density', 'cinematic', 'landscape', 'lens'],
  category: 'captions',
  component: NDGradientComponent as any,
  defaultConfig: {
    words: ['EXPOSE', 'FILTER', 'GRADIENT', 'LIGHT'],
    colors: ['#F0E8D0', '#FFFFFF', '#E8DEC0', '#FFF0D0'],
    bgColor: '#080604',
    cycleDuration: 1.5,
    gradientStrength: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EXPOSE', 'FILTER', 'GRADIENT', 'LIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0E8D0', '#FFFFFF', '#E8DEC0', '#FFF0D0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080604', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'gradientStrength', label: 'Gradient Strength (%)', type: 'number', defaultValue: 80, min: 40, max: 100, group: 'Animation' },
  ],
})
