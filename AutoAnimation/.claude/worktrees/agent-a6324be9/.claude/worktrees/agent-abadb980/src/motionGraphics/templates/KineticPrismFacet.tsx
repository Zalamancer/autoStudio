import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// -- Prism Facet --------------------------------------------------------------
// Each character sits on a face of a triangular prism. The prism rotates via
// rotateX to reveal each character face. Enter: prism rotates from the top face
// to the front face. Hold: gentle oscillation around the front face. Exit: prism
// continues rotating downward to the bottom face.

interface PrismFacetConfig extends KineticBaseConfig {
  prismDepth: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Prism light refraction bands */}
        {Array.from({ length: 7 }, (_, i) => {
          const hue = i * 52 // rainbow spectrum
          const yOffset = 30 + i * 6
          return (
            <div key={i} style={{
              position: 'absolute',
              left: 0, right: 0,
              top: `${yOffset + Math.sin(time * 0.4 + i * 0.5) * 1.5}%`,
              height: 2,
              background: `linear-gradient(90deg, transparent 5%, hsla(${hue},80%,60%,0.06) 30%, hsla(${hue},80%,60%,0.08) 50%, hsla(${hue},80%,60%,0.06) 70%, transparent 95%)`,
              mixBlendMode: 'screen',
            }} />
          )
        })}
        {/* Central diamond glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `conic-gradient(from ${time * 20}deg at 50% 50%, rgba(255,100,100,0.02), rgba(100,255,100,0.02), rgba(100,100,255,0.02), rgba(255,100,100,0.02))`,
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    // Each character is an independent prism
    const faceHeight = 80 // height of one prism face in px (used for translateZ)
    // Triangular prism: 3 faces, each rotated 120deg apart. We show face 0 (top/incoming),
    // face 1 (front/visible), face 2 (bottom/outgoing). Rotation maps: 120deg per face.

    const charElements = chars.map((ch, ci) => {
      const stagger = ci * 0.1
      const charEnter = Math.max(0, Math.min(1, (enterProgress - stagger) / Math.max(0.01, 1 - stagger * totalChars * 0.06)))
      const charExit = Math.max(0, Math.min(1, (exitProgress - ci * 0.07) / Math.max(0.01, 1 - (totalChars - 1) * 0.05)))

      // Prism rotation: enter rotates from -120 (top face) to 0 (front face)
      // Exit rotates from 0 to +120 (bottom face, continuing the rotation)
      let prismRotX = -120

      if (phase === 'enter') {
        const e = easeOutBack(charEnter)
        prismRotX = -120 + e * 120
      } else if (phase === 'hold') {
        // Gentle rocking
        prismRotX = Math.sin(holdProgress * Math.PI * 4 + ci * 1.1) * 4
      } else {
        const e = easeInExpo(charExit)
        prismRotX = e * 120 // continue rotating to next face
      }

      const opacity =
        phase === 'enter' ? Math.min(1, charEnter * 3)
        : phase === 'exit' ? Math.max(0, 1 - charExit * 1.5)
        : 1

      // The prism radius (apothem) for a triangle with face height faceHeight
      const prismRadius = faceHeight / (2 * Math.tan(Math.PI / 3))

      return (
        <div key={ci} style={{
          display: 'inline-block',
          margin: '0 2px',
          perspective: '500px',
          opacity,
        }}>
          <div style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${prismRotX}deg)`,
            position: 'relative',
            width: 'auto',
            height: `${faceHeight}px`,
          }}>
            {/* Front face (the visible one at rotateX=0) */}
            <div style={{
              position: 'absolute',
              transform: `translateZ(${prismRadius}px)`,
              backfaceVisibility: 'hidden',
              overflow: 'hidden',
            }}>
              <span style={{
                fontFamily: "'Trebuchet MS', 'Helvetica', sans-serif",
                fontSize: 'clamp(40px, 12vw, 160px)',
                fontWeight: 900,
                color,
                textShadow: `0 0 12px ${color}55`,
                display: 'block',
                lineHeight: `${faceHeight}px`,
              }}>
                {ch}
              </span>
            </div>

            {/* Top face (incoming from above) */}
            <div style={{
              position: 'absolute',
              transform: `rotateX(120deg) translateZ(${prismRadius}px)`,
              backfaceVisibility: 'hidden',
              overflow: 'hidden',
            }}>
              <span style={{
                fontFamily: "'Trebuchet MS', 'Helvetica', sans-serif",
                fontSize: 'clamp(40px, 12vw, 160px)',
                fontWeight: 900,
                color: `${color}88`,
                display: 'block',
                lineHeight: `${faceHeight}px`,
              }}>
                {ch}
              </span>
            </div>

            {/* Bottom face (exiting below) */}
            <div style={{
              position: 'absolute',
              transform: `rotateX(-120deg) translateZ(${prismRadius}px)`,
              backfaceVisibility: 'hidden',
              overflow: 'hidden',
            }}>
              <span style={{
                fontFamily: "'Trebuchet MS', 'Helvetica', sans-serif",
                fontSize: 'clamp(40px, 12vw, 160px)',
                fontWeight: 900,
                color: `${color}66`,
                display: 'block',
                lineHeight: `${faceHeight}px`,
              }}>
                {ch}
              </span>
            </div>
          </div>
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          whiteSpace: 'nowrap',
          alignItems: 'center',
        }}>
          {charElements}
        </div>
      </div>
    )
  },
}

function PrismFacetComponent(props: MotionGraphicProps<PrismFacetConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-prism-facet',
  title: 'Kinetic Prism Facet',
  description: 'Each character sits on a triangular prism face that rotates via rotateX to reveal text. Enter from top face, gentle rocking on hold, continue rotation to exit through bottom face.',
  tags: ['kinetic', 'typography', '3d', 'prism', 'facet', 'rotation', 'perspective', 'triangular', 'refraction'],
  category: 'captions',
  component: PrismFacetComponent as any,
  defaultConfig: {
    words: ['PRISM', 'LIGHT', 'FACET', 'SHIFT'],
    colors: ['#FF4488', '#44DDFF', '#FFDD44', '#88FF44'],
    bgColor: '#06060e',
    cycleDuration: 1.1,
    prismDepth: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRISM', 'LIGHT', 'FACET', 'SHIFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4488', '#44DDFF', '#FFDD44', '#88FF44'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06060e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.5, max: 5, group: 'Timing' },
    { key: 'prismDepth', label: 'Prism Depth', type: 'number', defaultValue: 80, min: 40, max: 200, group: 'Animation' },
  ],
})
