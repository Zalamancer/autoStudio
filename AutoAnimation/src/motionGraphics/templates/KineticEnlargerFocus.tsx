import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EnlargerFocusConfig extends KineticBaseConfig {}

// Easing: smooth focus pull feels natural, not mechanical
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t <= 0 ? 0 : Math.pow(2, 10 * t - 10)
}

/**
 * KineticEnlargerFocus
 * Simulates racking an enlarger lens into focus. The text starts as a huge,
 * over-bright, heavily blurred blob of light (out-of-focus projected image),
 * then rapidly sharpens — both blur and overexposure pulling down together —
 * until crisp text snaps into view with a brief halo ring. Stays sharp during
 * hold (slight breathing from vibration of the enlarger head). Exit defocuses
 * in reverse as the carrier is swapped.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const t = frame / fps
    // Enlarger beam: cone from top center — flickers slightly with AC lamp
    const lampFlicker = 0.9 + Math.sin(t * 47) * 0.04 + Math.sin(t * 23) * 0.06
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Projected light cone */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '140%',
          height: '100%',
          background: `conic-gradient(
            from 180deg at 50% -10%,
            transparent 60deg,
            rgba(255,248,230,${0.06 * lampFlicker}) 90deg,
            rgba(255,248,230,${0.11 * lampFlicker}) 180deg,
            rgba(255,248,230,${0.06 * lampFlicker}) 270deg,
            transparent 300deg
          )`,
          pointerEvents: 'none',
        }} />
        {/* Enlarger head silhouette at top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 80,
          height: 18,
          background: 'rgba(30,25,20,0.9)',
          borderRadius: '0 0 6px 6px',
        }} />
        {/* Lens element circle */}
        <div style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '2px solid rgba(80,70,55,0.6)',
          background: 'rgba(10,8,5,0.8)',
          boxShadow: `0 0 ${8 * lampFlicker}px 2px rgba(255,240,200,0.08)`,
        }} />
        {/* Easel baseboard edge at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'rgba(50,40,30,0.4)',
          borderTop: '1px solid rgba(80,70,55,0.3)',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, fps }: WordRenderProps) => {
    const t = (frame ?? 0) / (fps ?? 30)

    // Defocus amount: 0 = sharp, 1 = maximally blurred
    let defocus = 0
    let overexposure = 0     // extra brightness from out-of-focus bright spot
    let scale = 1
    let opacity = 1
    let haloOpacity = 0

    if (phase === 'enter') {
      // Rack from blurry to sharp
      const sharpness = easeOutExpo(enterProgress)   // 0 → 1
      defocus = 1 - sharpness
      overexposure = defocus * 2.8     // blown-out when defocused
      // Scale: slightly larger when defocused (projected circle is bigger)
      scale = 1.4 - sharpness * 0.4
      opacity = 0.3 + sharpness * 0.7
      // Snap halo: brief ring as it hits focus at enterProgress≈0.85+
      haloOpacity = enterProgress > 0.85
        ? Math.max(0, 1 - (enterProgress - 0.85) / 0.15) * 0.5
        : 0
    } else if (phase === 'hold') {
      defocus = 0
      overexposure = 0
      scale = 1
      opacity = 1
      // Subtle mechanical vibration while carrier is held
      const vib = Math.sin(t * 28) * 0.003
      scale = 1 + vib
    } else {
      // Defocus out — carrier being swapped
      const defocusP = easeInExpo(exitProgress)
      defocus = defocusP
      overexposure = defocusP * 2.0
      scale = 1 + defocusP * 0.5
      opacity = 1 - defocusP * 0.7
    }

    const blurPx = defocus * 28
    const brightnessVal = 1 + overexposure
    const contrastVal = Math.max(0.2, 1 - defocus * 0.75)

    const filterStr = [
      blurPx > 0.1 ? `blur(${blurPx.toFixed(2)}px)` : '',
      `brightness(${brightnessVal.toFixed(3)})`,
      `contrast(${contrastVal.toFixed(3)})`,
    ].filter(Boolean).join(' ')

    return (
      <>
        {/* Focus-snap halo ring */}
        {haloOpacity > 0.01 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(150px, 40vw, 500px)',
            height: 'clamp(60px, 14vw, 180px)',
            borderRadius: '50%',
            border: `2px solid rgba(255,248,220,${haloOpacity})`,
            pointerEvents: 'none',
          }} />
        )}

        {/* The text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale.toFixed(4)})`,
          opacity,
          filter: filterStr,
        }}>
          <div style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 'clamp(42px, 10vw, 140px)',
            fontWeight: 300,
            letterSpacing: '0.12em',
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}>
            {word}
          </div>
        </div>

        {/* Focus ring indicator — bottom of frame */}
        <div style={{
          position: 'absolute',
          bottom: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          opacity: Math.min(opacity, 0.4),
          fontFamily: 'monospace',
          fontSize: 'clamp(8px, 1.5vw, 12px)',
          color: `${color}88`,
          letterSpacing: 2,
          whiteSpace: 'nowrap',
        }}>
          <span>{'◁'.repeat(Math.round(defocus * 3))}</span>
          <span>FOCUS</span>
          <span>{'▷'.repeat(Math.round(defocus * 3))}</span>
        </div>
      </>
    )
  },
}

function EnlargerFocusComponent(props: MotionGraphicProps<EnlargerFocusConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-enlarger-focus',
  title: 'Enlarger Focus',
  description: 'Racks an enlarger lens into focus — text starts as a massively blurred, overexposed blob of projected light, then snaps to crisp clarity with a brief halo ring. Defocuses on exit.',
  tags: ['kinetic', 'typography', 'enlarger', 'focus', 'darkroom', 'photography', 'blur', 'light', 'analog', 'optical'],
  category: 'captions',
  component: EnlargerFocusComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'SHARP', 'EXPOSE', 'PRINT'],
    colors: ['#f0ece2', '#e8e4da', '#faf6f0', '#dedad2'],
    bgColor: '#0c0a06',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'SHARP', 'EXPOSE', 'PRINT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#f0ece2', '#e8e4da', '#faf6f0', '#dedad2'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0a06', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.6, max: 5, group: 'Timing' },
  ],
})
