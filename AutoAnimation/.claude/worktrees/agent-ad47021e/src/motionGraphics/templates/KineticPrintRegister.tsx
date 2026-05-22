import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PrintRegisterConfig extends KineticBaseConfig {
  ghostLayers: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Ghost layers — slightly off-color/off-position to simulate pre-registration state
const GHOST_LAYERS = [
  { x: -6, y: -3, opacity: 0.2, color: '#FF0040' },
  { x: 5, y: -5, opacity: 0.18, color: '#0080FF' },
  { x: -4, y: 5, opacity: 0.15, color: '#00CC44' },
  { x: 3, y: 4, opacity: 0.12, color: '#FF8800' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Registration marks in all four corners */}
      {[
        { top: 12, left: 12 },
        { top: 12, right: 12 },
        { bottom: 12, left: 12 },
        { bottom: 12, right: 12 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            opacity: 0.25,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="none" stroke="white" strokeWidth="1" />
            <line x1="8" y1="0" x2="8" y2="16" stroke="white" strokeWidth="0.8" />
            <line x1="0" y1="8" x2="16" y2="8" stroke="white" strokeWidth="0.8" />
          </svg>
        </div>
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width }: WordRenderProps) => {
    let registerProgress = 0
    let globalOpacity = 1
    let ghostVisibility = 0

    if (phase === 'enter') {
      globalOpacity = Math.min(1, enterProgress * 2)
      // Ghost layers visible first (0-40%), register snaps (30-100%)
      ghostVisibility = Math.max(0, 1 - easeOutExpo(Math.min(1, (enterProgress - 0.1) / 0.5)))
      registerProgress = easeOutExpo(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.75)))
    } else if (phase === 'hold') {
      registerProgress = 1
      globalOpacity = 1
      // Micro registration drift on hold — barely perceptible
      ghostVisibility = Math.abs(Math.sin(holdProgress * Math.PI * 3)) * 0.08
    } else {
      // Layers drift apart on exit
      registerProgress = 1 - easeInCubic(exitProgress)
      globalOpacity = 1 - easeInCubic(Math.max(0, (exitProgress - 0.3) / 0.7))
      ghostVisibility = easeInCubic(exitProgress) * 0.5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap',
          opacity: globalOpacity,
        }}
      >
        {/* Ghost/misregistered layers */}
        {GHOST_LAYERS.map((ghost, gi) => {
          const gx = ghost.x * (1 - registerProgress)
          const gy = ghost.y * (1 - registerProgress)

          return (
            <div
              key={gi}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${gx}px), calc(-50% + ${gy}px))`,
                opacity: ghost.opacity * ghostVisibility,
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color: ghost.color,
                  display: 'block',
                  lineHeight: 1,
                  letterSpacing: 3,
                }}
              >
                {word}
              </span>
            </div>
          )
        })}

        {/* Main registered layer */}
        <div
          style={{
            position: 'relative',
          }}
        >
          <span
            style={{
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 13vw, 168px)',
              fontWeight: 900,
              color,
              display: 'block',
              lineHeight: 1,
              letterSpacing: 3,
              textShadow: `
                0 0 ${ghostVisibility * 20}px rgba(255,0,0,${ghostVisibility * 0.3}),
                0 0 ${ghostVisibility * 20}px rgba(0,0,255,${ghostVisibility * 0.3}),
                2px 2px 0 rgba(0,0,0,0.3)
              `,
            }}
          >
            {word}
          </span>
        </div>

        {/* "REGISTERED" badge that appears when fully locked */}
        {registerProgress > 0.95 && phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              bottom: 'clamp(-22px, -5vw, -50px)',
              right: 0,
              fontFamily: 'monospace',
              fontSize: 'clamp(8px, 1.5vw, 14px)',
              color,
              opacity: (registerProgress - 0.95) * 20 * 0.5,
              letterSpacing: 3,
            }}
          >
            ✓ REGISTERED
          </div>
        )}
      </div>
    )
  },
}

function PrintRegisterComponent(props: MotionGraphicProps<PrintRegisterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-print-register',
  title: 'Kinetic Print Register',
  description: 'Multiple color ghost layers start misaligned in classic print misregistration — RGB ghosts drift around the main text before all snapping into perfect registration with a "✓ REGISTERED" stamp.',
  tags: ['kinetic', 'typography', 'print', 'registration', 'ghost', 'misalign', 'layer', 'rgb', 'offset', 'build'],
  category: 'captions',
  component: PrintRegisterComponent as any,
  defaultConfig: {
    words: ['ALIGN', 'LOCK', 'REGISTER', 'PERFECT'],
    colors: ['#FFFFFF', '#F0F0F0', '#E8E8E8', '#D0D0D0'],
    bgColor: '#111111',
    cycleDuration: 1.8,
    ghostLayers: 4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ALIGN', 'LOCK', 'REGISTER', 'PERFECT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#F0F0F0', '#E8E8E8', '#D0D0D0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'ghostLayers', label: 'Ghost Layers', type: 'number', defaultValue: 4, min: 2, max: 6, group: 'Animation' },
  ],
})
