import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AnamorphicReflectConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Anamorphic: extreme horizontal squeeze that only resolves correctly
// when viewed from a specific angle (or through a cylindrical mirror)
// Classic street art anamorphic effect
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Perspective grid — the "floor" the anamorphic is painted on
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Perspective lines converging to horizon */}
        {Array.from({ length: 7 }, (_, i) => {
          const xPos = (i / 6) * 100
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${xPos}%`,
                width: 1,
                height: '50%',
                background: `rgba(255,255,255,${0.03 + Math.sin(time * 0.7 + i) * 0.01})`,
                transformOrigin: 'top center',
                transform: `perspective(400px) rotateX(60deg)`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))
    const backEased = easeOutBack(Math.min(enterProgress, 1))

    // Anamorphic squeeze — starts fully squeezed (appearing as a thin stripe) then resolves
    // The "viewing angle correction" animates from extreme to normal
    const squeezeX =
      phase === 'enter'
        ? 0.05 + backEased * 0.95 // starts as thin vertical stripe, expands to normal
        : phase === 'hold'
          ? 1 + Math.sin(time * 0.6) * 0.04 // slight breathing suggests depth
          : 1 - easeOutExpo(exitProgress) * 0.9 // re-squeezes on exit

    // Vertical stretch that's the "correct" anamorphic shape when squeezed
    const stretchY =
      phase === 'enter'
        ? 1 + (1 - eased) * 2.5 // very tall when squeezed
        : phase === 'hold'
          ? 1 + Math.sin(time * 0.6) * 0.02
          : 1 + easeOutExpo(exitProgress) * 2

    // Entry scale
    const scale = phase === 'enter' ? 0.3 + backEased * 0.7 : 1

    // Hold: subtle "viewing angle" micro-rotation
    const tiltAngle = phase === 'hold' ? Math.sin(time * 0.8) * 2 : 0

    const opacity =
      phase === 'enter' ? Math.min(1, enterProgress * 3) : phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : 1

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Shadow/Repeat — anamorphic art often has a "stretched" shadow */}
        {phase !== 'exit' && (
          <div
            style={{
              position: 'absolute',
              top: '60%',
              left: '50%',
              transform: `translate(-50%, 0) scaleX(${squeezeX * scale * 1.1}) scaleY(${stretchY * 0.3}) skewX(10deg)`,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 900,
              color: 'rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              filter: 'blur(3px)',
              opacity: 0.4 * eased,
            }}
          >
            {word}
          </div>
        )}

        {/* Main anamorphic text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${squeezeX * scale}) scaleY(${stretchY}) rotate(${tiltAngle}deg)`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textShadow:
              squeezeX < 0.5 ? `0 0 ${(1 - squeezeX) * 20}px rgba(255,150,0,0.3)` : `0 0 8px rgba(255,255,255,0.1)`,
          }}
        >
          {word}
        </div>

        {/* Anamorphic "correct viewpoint" indicator — small label */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              bottom: '18%',
              right: '8%',
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: `${color}40`,
              letterSpacing: 1,
            }}
          >
            ANAMORPHIC
          </div>
        )}
      </div>
    )
  },
}

function AnamorphicReflectComponent(props: MotionGraphicProps<AnamorphicReflectConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-anamorphic-reflect',
  title: 'Kinetic Anamorphic Reflect',
  description:
    'Anamorphic perspective reveal — text starts as an extreme horizontal squeeze (a thin stripe) that expands as the viewing angle "corrects", resolving to the full word',
  tags: ['kinetic', 'typography', 'anamorphic', 'reflection', 'squeeze', 'perspective', 'optical', 'street-art'],
  category: 'captions',
  component: AnamorphicReflectComponent as any,
  defaultConfig: {
    words: ['MORPH', 'ANGLE', 'VIEW', 'ANAM'],
    colors: ['#FF6622', '#FF8844', '#FFAA66', '#FF4400'],
    bgColor: '#060402',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['MORPH', 'ANGLE', 'VIEW', 'ANAM'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6622', '#FF8844'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060402', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
