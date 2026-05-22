import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Compression/Expansion 1: Hydraulic Press ─────────────────────────────────
// A massive hydraulic press slams down and crushes text flat (scaleY→0),
// then retracts and text springs back with elasticity.

interface HydraulicPressConfig extends KineticBaseConfig {
  crushAmount: number
  pressSpeed: number
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Industrial metal texture suggestions */}
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${i * 25}%`, top: 0, bottom: 0, width: 1,
          background: `rgba(255,255,255,0.02)`,
        }} />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Press plate position
    let plateY = -80  // starts above
    let plateShadowOp = 0
    let textScaleY = 1
    let textScaleX = 1
    let textOp = 1
    let textY = 0
    let textBlur = 0
    // Squish particle spray
    let squishVisible = false
    let squishOp = 0

    if (phase === 'enter') {
      // Press slams down, text gets crushed as it enters
      if (enterProgress < 0.5) {
        // Press descending
        const p = enterProgress / 0.5
        const e = easeInExpo(p)
        plateY = -80 + e * (height * 0.5 + 80)
        plateShadowOp = p * 0.6
        textScaleY = 1 - e * 0.9
        textScaleX = 1 + e * 2.5 // squishes out sideways
        textOp = 0.3 + p * 0.7
      } else {
        // Press retracts, text springs back
        const p = (enterProgress - 0.5) / 0.5
        const e = easeOutBack(p)
        plateY = height * 0.5 - e * (height * 0.5 + 80)
        plateShadowOp = (1 - p) * 0.4
        squishVisible = p < 0.4
        squishOp = squishVisible ? (1 - p / 0.4) : 0
        textScaleY = 0.1 + e * 0.9
        textScaleX = 3.5 - e * 2.5
        textOp = 1
      }
    } else if (phase === 'hold') {
      // Text alive, gentle breathing
      plateY = -80
      textScaleY = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.03
      textScaleX = 1 - Math.sin(holdProgress * Math.PI * 4) * 0.015
    } else {
      // Exit: press comes back down and holds text crushed
      const p = easeOutCubic(exitProgress)
      plateY = -80 + p * (height * 0.5 + 80)
      plateShadowOp = p * 0.7
      textScaleY = 1 - p * 0.95
      textScaleX = 1 + p * 3
      textOp = 1 - p * 0.5
      textBlur = p * 5
    }

    // Squish spray particles
    const squishParticles = squishVisible
      ? Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const dist = squishOp < 0.5 ? 80 * (1 - squishOp * 2) : 0
          const px = width / 2 + Math.cos(angle) * dist * (i % 2 === 0 ? 2 : 1) + (Math.sin(angle) > 0 ? 30 : -30)
          const py = height / 2 + Math.sin(angle) * dist * 0.3
          return (
            <div key={i} style={{
              position: 'absolute',
              left: px - 3, top: py - 3,
              width: 6, height: 6,
              background: color,
              borderRadius: '50%',
              opacity: squishOp * 0.8,
              transform: `scale(${squishOp})`,
            }} />
          )
        })
      : []

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Press shadow on text */}
        <div style={{
          position: 'absolute',
          bottom: '45%', left: '10%', right: '10%',
          height: 20,
          background: `radial-gradient(ellipse at 50% 100%, rgba(0,0,0,${plateShadowOp * 0.6}) 0%, transparent 100%)`,
          filter: 'blur(8px)',
        }} />

        {/* Press plate */}
        <div style={{
          position: 'absolute',
          left: '-10%', right: '-10%',
          top: plateY,
          height: 80,
          background: `linear-gradient(to bottom, #888 0%, #555 30%, #333 100%)`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.8), inset 0 -2px 0 rgba(255,255,255,0.1)`,
          borderBottom: '4px solid #222',
        }}>
          {/* Hydraulic piston */}
          <div style={{
            position: 'absolute', top: -60, left: '40%', right: '40%',
            height: 60,
            background: `linear-gradient(to right, #666, #888, #666)`,
          }} />
        </div>

        {squishParticles}

        {/* Text */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) scaleX(${textScaleX}) scaleY(${textScaleY})`,
          transformOrigin: 'center top',
          opacity: textOp,
          filter: `blur(${textBlur}px)`,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(50px, 12vw, 150px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          textShadow: `0 2px 0 rgba(0,0,0,0.8)`,
          letterSpacing: '-0.02em',
        }}>
          {word}
        </div>
      </div>
    )
  },
}

function HydraulicPressComponent(props: MotionGraphicProps<HydraulicPressConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hydraulic-press',
  title: 'Kinetic Hydraulic Press',
  description: 'An industrial press slams down and crushes text completely flat (scaleY=0.1, scaleX=3.5), then retracts with elastic spring-back and squish particles.',
  tags: ['kinetic', 'typography', 'press', 'crush', 'compression', 'squish', 'impact', 'industrial'],
  category: 'captions',
  component: HydraulicPressComponent as any,
  defaultConfig: {
    words: ['CRUSH', 'PRESS', 'FLAT', 'SLAM'],
    colors: ['#FFFFFF', '#FF4444', '#FFFFFF', '#FFAA00'],
    bgColor: '#111111',
    cycleDuration: 1.5,
    crushAmount: 1,
    pressSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRUSH', 'PRESS', 'FLAT', 'SLAM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FF4444', '#FFFFFF', '#FFAA00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'crushAmount', label: 'Crush Intensity', type: 'number', defaultValue: 1, min: 0.3, max: 2, group: 'Animation' },
    { key: 'pressSpeed', label: 'Press Speed', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
