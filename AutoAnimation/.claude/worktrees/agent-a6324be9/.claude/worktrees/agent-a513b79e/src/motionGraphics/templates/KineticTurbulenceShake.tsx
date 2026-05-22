import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TurbulenceShakeConfig extends KineticBaseConfig {
  intensity: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

// Multi-frequency turbulence: combines slow roll + high-freq chop
function turbulenceOffset(t: number, seed: number, intensity: number): { x: number; y: number; r: number } {
  // Slow roll (aircraft body movement)
  const slowX = Math.sin(t * Math.PI * 2.3 + seed) * intensity * 1.2
  const slowY = Math.cos(t * Math.PI * 1.7 + seed * 1.3) * intensity * 0.8
  // High-freq chop (air pocket hits)
  const chopX = Math.sin(t * Math.PI * 11 + seed * 2) * intensity * 0.5
  const chopY = Math.cos(t * Math.PI * 9.3 + seed * 0.7) * intensity * 0.4
  // Torsional roll
  const roll = Math.sin(t * Math.PI * 3.1 + seed * 0.5) * intensity * 0.4

  return {
    x: slowX + chopX,
    y: slowY + chopY,
    r: roll,
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Warning stripe: turbulence zone indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, transparent, #ffaa00, #ff6600, #ffaa00, transparent)',
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, transparent, #ffaa00, #ff6600, #ffaa00, transparent)',
          opacity: 0.6,
        }}
      />
      {/* Fasten seatbelt indicator dot */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '16px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#ffaa00',
          boxShadow: '0 0 8px #ffaa00',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frameNumber }: WordRenderProps) => {
    const intensity = 8 // px — severity of turbulence

    const isEnter = phase === 'enter'
    const isExit = phase === 'exit'
    const isHold = phase === 'hold'

    // Enter: slams in from above, like hitting an air pocket dropping the aircraft
    const enterY = isEnter ? (1 - easeOutExpo(enterProgress)) * -80 : 0
    const enterScale = isEnter ? 0.6 + easeOutExpo(enterProgress) * 0.4 : 1
    const enterOpacity = isEnter ? Math.min(1, enterProgress * 3) : 1

    // Exit: shaken off the screen — jostles out downward
    const exitY = isExit ? easeInExpo(exitProgress) * 60 : 0
    const exitOpacity = isExit ? 1 - easeInExpo(exitProgress) : 1
    const exitScale = isExit ? 1 - exitProgress * 0.15 : 1

    // Turbulence during hold and partial during transitions
    // frameNumber gives a continuously advancing value for oscillation
    const turbTime = (frameNumber ?? 0) / 60
    const holdFraction = isHold ? 1 : isEnter ? easeOutExpo(enterProgress) : isExit ? 1 - exitProgress : 0
    const { x: tx, y: ty, r: tr } = turbulenceOffset(turbTime, 1.23, intensity * holdFraction)

    // Chromatic aberration proxy: split shadow offsets during peak turbulence
    const aberration = Math.abs(tx) > intensity * 0.5 ? Math.abs(tx) * 0.15 : 0

    const finalX = tx
    const finalY = enterY + exitY + ty
    const finalScale = enterScale * exitScale
    const finalOpacity = enterOpacity * exitOpacity
    const finalRotation = tr

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${finalX.toFixed(2)}px), calc(-50% + ${finalY.toFixed(2)}px)) scale(${finalScale.toFixed(3)}) rotate(${finalRotation.toFixed(2)}deg)`,
          opacity: finalOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 900,
            letterSpacing: '0.04em',
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            // Chromatic aberration via text-shadow split on heavy shake
            textShadow: aberration > 0
              ? `${aberration.toFixed(1)}px 0 rgba(255,0,80,0.7), -${aberration.toFixed(1)}px 0 rgba(0,200,255,0.7)`
              : 'none',
          }}
        >
          {word}
        </div>
        {/* Shockwave ring on slam-in */}
        {isEnter && enterProgress < 0.35 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${1 + enterProgress * 2})`,
              width: '100%',
              height: '100%',
              border: `2px solid ${color}`,
              borderRadius: '4px',
              opacity: Math.max(0, 0.7 - enterProgress * 2),
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function TurbulenceShakeComponent(props: MotionGraphicProps<TurbulenceShakeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-turbulence-shake',
  title: 'Turbulence Shake',
  description:
    'Text rattles with multi-frequency oscillation mimicking aircraft turbulence — slow body roll plus high-frequency air-pocket chop, with chromatic aberration on heavy hits.',
  tags: ['kinetic', 'typography', 'aviation', 'turbulence', 'shake', 'cockpit', 'impact'],
  category: 'captions',
  component: TurbulenceShakeComponent as any,
  defaultConfig: {
    words: ['HOLD ON', 'BRACE', 'ROUGH AIR', 'TURBULENT'],
    colors: ['#ffcc00', '#ff6600', '#ffcc00', '#ff6600'],
    bgColor: '#111111',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HOLD ON', 'BRACE', 'ROUGH AIR', 'TURBULENT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffcc00', '#ff6600', '#ffcc00', '#ff6600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'intensity', label: 'Shake Intensity', type: 'number', defaultValue: 8, min: 2, max: 20, group: 'Effect' },
  ],
})
