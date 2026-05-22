import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CoinFlipConfig extends KineticBaseConfig {
  flipTurns: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Coin flip: fast arc trajectory with deceleration at landing
function coinFlipEase(t: number): number {
  // First 40% is airborne (fast), last 60% is landing deceleration
  if (t < 0.4) return t / 0.4 * 0.6
  return 0.6 + easeOutCubic((t - 0.4) / 0.6) * 0.4
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__coinFlipConfig ?? { flipTurns: 2 }
    const flipTurns = config.flipTurns ?? 2

    let rotateY = 0
    let scaleX = 1
    let translateY = 0
    let opacity = 1
    let showText = false

    if (phase === 'enter') {
      const t = coinFlipEase(enterProgress)
      // Multiple full rotations + final landing on "heads" (text side)
      const totalRotation = flipTurns * 360
      rotateY = totalRotation * t
      // Arc: rise then fall
      const arc = Math.sin(enterProgress * Math.PI)
      translateY = -height * 0.35 * arc
      // Show text when face-up (near 0/360 deg mod 180)
      const faceAngle = rotateY % 360
      const normalizedFace = faceAngle > 180 ? 360 - faceAngle : faceAngle
      showText = normalizedFace < 90 || enterProgress > 0.85
      opacity = enterProgress < 0.1 ? enterProgress * 10 : 1
    } else if (phase === 'hold') {
      rotateY = flipTurns * 360
      showText = true
      // Subtle shimmer wobble
      rotateY += Math.sin(holdProgress * Math.PI * 4) * 4
      opacity = 1
    } else {
      const eased = easeInCubic(exitProgress)
      rotateY = flipTurns * 360 + eased * 180
      translateY = height * 0.4 * eased
      showText = exitProgress < 0.5
      opacity = exitProgress < 0.7 ? 1 : (1 - exitProgress) / 0.3
    }

    // Coin dimensions
    const coinR = Math.min(width, height) * 0.36
    const coinW = coinR * 2
    const coinH = coinR * 1.1

    // scaleX simulates perspective foreshortening during rotation
    const faceAngleMod = ((rotateY % 180) + 180) % 180
    const perspectiveScale = Math.abs(Math.cos((faceAngleMod * Math.PI) / 180))
    const isHeads = faceAngleMod < 90

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: `translateY(${translateY}px)`,
          }}
        >
          {/* Coin body */}
          <div
            style={{
              width: coinW * perspectiveScale,
              height: coinH,
              borderRadius: '50%',
              background: isHeads
                ? `radial-gradient(ellipse at 38% 35%, #ffd700, #c8960c 55%, #a07800 100%)`
                : `radial-gradient(ellipse at 60% 65%, #c0c0c0, #888 55%, #666 100%)`,
              boxShadow: isHeads
                ? `0 8px 24px rgba(200,150,0,0.5), inset 0 -4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,215,0,0.3)`
                : `0 8px 24px rgba(0,0,0,0.4), inset 0 -4px 8px rgba(0,0,0,0.3)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Coin rim */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `3px solid ${isHeads ? 'rgba(255,220,80,0.5)' : 'rgba(200,200,200,0.5)'}`,
                boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4)',
              }}
            />

            {/* Heads face: text */}
            {isHeads && showText && (
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: `clamp(16px, ${4.5 * perspectiveScale}vw, ${coinR * 0.55}px)`,
                  fontWeight: 900,
                  color: '#7a5200',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  textShadow: '0 1px 2px rgba(255,200,0,0.4)',
                  zIndex: 2,
                }}
              >
                {word}
              </div>
            )}

            {/* Tails: ridged pattern */}
            {!isHeads && (
              <>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: coinW * perspectiveScale * (0.95 - j * 0.16),
                      height: coinH * (0.95 - j * 0.16),
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.15)',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}
              </>
            )}

            {/* Shine highlight */}
            <div
              style={{
                position: 'absolute',
                top: '8%',
                left: '15%',
                width: '40%',
                height: '32%',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                filter: 'blur(6px)',
              }}
            />
          </div>

          {/* Drop shadow on "table" */}
          <div
            style={{
              position: 'absolute',
              bottom: -16,
              left: '50%',
              transform: 'translateX(-50%)',
              width: coinW * perspectiveScale * 0.8,
              height: 12,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.3)',
              filter: 'blur(8px)',
            }}
          />
        </div>
      </div>
    )
  },
}

function CoinFlipComponent(props: MotionGraphicProps<CoinFlipConfig>) {
  ;(globalThis as any).__coinFlipConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-coin-flip',
  title: 'Kinetic Coin Flip',
  description: 'Text appears on a gold coin that flips through the air and lands heads-up, revealing the word',
  tags: ['kinetic', 'typography', 'coin', 'flip', 'reveal', 'mechanical', 'everyday', '3d', 'gold'],
  category: 'captions',
  component: CoinFlipComponent as any,
  defaultConfig: {
    words: ['HEADS', 'WIN', 'LUCKY', 'GOLD'],
    colors: ['#FFD700', '#FFC107', '#FF8C42', '#FFD700'],
    bgColor: '#0c0c18',
    cycleDuration: 1.8,
    flipTurns: 2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['HEADS', 'WIN', 'LUCKY', 'GOLD'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FFC107', '#FF8C42'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c18', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.8,
      max: 5,
      group: 'Timing',
    },
    { key: 'flipTurns', label: 'Flip Rotations', type: 'number', defaultValue: 2, min: 1, max: 5, group: 'Animation' },
  ],
})
