import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DollyZoomConfig extends KineticBaseConfig {
  zoomIntensity: number
}

// Hitchcock / Vertigo effect:
// Subject (text) stays the same apparent size while the background zooms OUT,
// creating that unsettling spatial distortion.
// We simulate: text scales UP (longer focal length) while bg compresses (dolly moves back).

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, enterProgress, holdProgress, exitProgress, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Animate bg scale — zooms OUT during enter, holds, zooms back during exit
    // (In the real Vertigo effect the camera dollies forward while zoom lens zooms out)
    const bgScaleEnter = 1 + (1 - (enterProgress ?? 0)) * 0.35
    const bgScaleExit = 1 + (exitProgress ?? 0) * 0.35
    const bgScale = holdProgress != null && holdProgress > 0 ? 1 : exitProgress != null && exitProgress > 0 ? bgScaleExit : bgScaleEnter

    // Receding parallel lines on background — converging perspective lines
    const lineCount = 8
    const lines = Array.from({ length: lineCount }, (_, i) => i)

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          overflow: 'hidden',
        }}
      >
        {/* Receding perspective lines that scale with BG */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${bgScale})`,
            transformOrigin: '50% 50%',
            transition: 'none',
          }}
        >
          {lines.map(i => {
            const angle = (i / lineCount) * 360
            const length = 80
            const cx = 50
            const cy = 50
            const rad = (angle * Math.PI) / 180
            const x2 = cx + Math.cos(rad) * length
            const y2 = cy + Math.sin(rad) * length
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${cx}%`,
                  top: `${cy}%`,
                  width: `${length}%`,
                  height: 1,
                  background: 'rgba(255,255,255,0.06)',
                  transformOrigin: '0% 50%',
                  transform: `rotate(${angle}deg)`,
                }}
              />
            )
          })}
          {/* Concentric depth rings */}
          {[15, 28, 44, 62, 80].map((r, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${r * 2}%`,
                height: `${r * 2}%`,
                marginLeft: `-${r}%`,
                marginTop: `-${r}%`,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            />
          ))}
        </div>
        {/* Cinematic vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,0.7) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

    // Text scale increases as if shot with longer focal length (dolly back + zoom in)
    let textScale: number
    let opacity: number
    let perspectiveShift: number // vertical shift — vertigo feeling

    if (phase === 'enter') {
      const ep = easeInOut(enterProgress)
      textScale = 0.7 + ep * 0.3  // grows from 0.7x to 1.0x
      opacity = ep
      perspectiveShift = (1 - ep) * 12  // drops into frame
    } else if (phase === 'hold') {
      textScale = 1
      opacity = 1
      perspectiveShift = 0
    } else {
      const ep = easeInOut(exitProgress)
      textScale = 1 + ep * 0.15  // continues growing slightly
      opacity = 1 - ep
      perspectiveShift = -ep * 8
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${perspectiveShift}px)) scale(${textScale})`,
          whiteSpace: 'nowrap',
        }}
      >
        {/* Depth blur shadow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(255,180,60,0.25)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            filter: 'blur(18px)',
            opacity,
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity,
            textShadow: `0 0 40px rgba(255,180,60,0.2), 0 2px 4px rgba(0,0,0,0.8)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function DollyZoomComponent(props: MotionGraphicProps<DollyZoomConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dolly-zoom',
  title: 'Kinetic Dolly Zoom',
  description: "Hitchcock Vertigo effect: text scales up as background depth zooms out, creating the iconic unsettling spatial distortion",
  tags: ['kinetic', 'typography', 'film', 'camera', 'dolly zoom', 'vertigo', 'hitchcock', 'cinematic', 'perspective'],
  category: 'captions',
  component: DollyZoomComponent as any,
  defaultConfig: {
    words: ['VERTIGO', 'DEPTH', 'FALL', 'SPIRAL'],
    colors: ['#F5E6C8', '#FFD080', '#FFFFFF', '#E8C870'],
    bgColor: '#080608',
    cycleDuration: 1.5,
    zoomIntensity: 35,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VERTIGO', 'DEPTH', 'FALL', 'SPIRAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E6C8', '#FFD080', '#FFFFFF', '#E8C870'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080608', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'zoomIntensity', label: 'Zoom Intensity (%)', type: 'number', defaultValue: 35, min: 10, max: 80, group: 'Animation' },
  ],
})
