import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PerspectiveWarpConfig extends KineticBaseConfig {
  warpDepth: number
}

// Perspective warp reveal — text enters deep in 3D perspective (sharp vanishing point tilt),
// rotates to face-on for the hold, then tips back into perspective on exit.
// CSS perspective + rotateX does the heavy lifting; no SVG filters needed.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 60%, transparent 30%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* Single horizon line — emphasises the perspective plane */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: 1,
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const easeIn  = (t: number) => Math.pow(t, 3)

    let tilt: number    // 0 = face-on, 1 = maximum tilt away from viewer
    let opacity: number
    let rotX: number    // degrees of CSS rotateX
    let scaleBoost: number  // compensate perceived size loss at tilt

    if (phase === 'enter') {
      const ep = easeOut(enterProgress)
      tilt = 1 - ep
      opacity = 0.2 + ep * 0.8
      rotX = tilt * 62           // enters from ~62° tilt
      scaleBoost = 1 + tilt * 0.3
    } else if (phase === 'hold') {
      tilt = 0
      opacity = 1
      rotX = 0
      scaleBoost = 1
    } else {
      const ep = easeIn(exitProgress)
      tilt = ep
      opacity = 1 - ep * 0.8
      rotX = tilt * -58          // exits tipping forward
      scaleBoost = 1 + tilt * 0.25
    }

    // Slight perspective-induced blur — mimics depth-of-field at extreme tilt
    const blurAmount = tilt > 0.1 ? tilt * 2.5 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          perspective: '600px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* Shadow plane — depth cue that stays flat while text tips */}
        {tilt > 0.05 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotateX(${rotX * 0.4}deg) scale(${scaleBoost * 1.05})`,
              fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 300,
              color: 'rgba(0,0,0,0.5)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              filter: `blur(${blurAmount + 4}px)`,
              opacity: tilt * 0.4,
              transformOrigin: '50% 50%',
            }}
          >
            {word}
          </div>
        )}
        {/* Main text */}
        <div
          style={{
            position: 'relative',
            transform: `rotateX(${rotX}deg) scale(${scaleBoost})`,
            transformOrigin: '50% 50%',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 300,
            color,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            opacity,
            filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
            textShadow: tilt < 0.05 ? '0 2px 28px rgba(255,255,255,0.1)' : 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PerspectiveWarpComponent(props: MotionGraphicProps<PerspectiveWarpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-perspective-warp',
  title: 'Kinetic Perspective Warp',
  description: 'Perspective warp reveal: text enters deep in 3D perspective as if seen from a low vanishing point, rotates face-on to a sharp hold, then tips away on exit',
  tags: ['kinetic', 'typography', 'perspective', '3d', 'warp', 'cinematic', 'brand', 'product', 'reveal'],
  category: 'captions',
  component: PerspectiveWarpComponent as any,
  defaultConfig: {
    words: ['ELEVATION', 'DEPTH', 'SIGNAL', 'SHIFT'],
    colors: ['#FFFFFF', '#F0F4FF', '#E0EBFF', '#F8FAFF'],
    bgColor: '#08090F',
    cycleDuration: 1.3,
    warpDepth: 62,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ELEVATION', 'DEPTH', 'SIGNAL', 'SHIFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#F0F4FF', '#E0EBFF', '#F8FAFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08090F', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
    { key: 'warpDepth', label: 'Warp Depth (deg)', type: 'number', defaultValue: 62, min: 20, max: 80, group: 'Animation' },
  ],
})
