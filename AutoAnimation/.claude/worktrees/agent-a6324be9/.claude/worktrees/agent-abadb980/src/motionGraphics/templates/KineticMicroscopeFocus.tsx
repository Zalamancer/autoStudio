import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MicroscopeFocusConfig extends KineticBaseConfig {}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Microscope specimen: scattered cell-like shapes on a slide
    const cells: { x: number; y: number; rx: number; ry: number; rot: number; o: number }[] = []
    for (let i = 0; i < 35; i++) {
      cells.push({
        x: pseudo(i * 53 + 7) * width,
        y: pseudo(i * 41 + 13) * height,
        rx: 8 + pseudo(i * 29 + 3) * 18,
        ry: 6 + pseudo(i * 37 + 11) * 14,
        rot: pseudo(i * 61 + 19) * 360,
        o: 0.03 + pseudo(i * 17 + 23) * 0.06,
      })
    }

    // Stage drift — very slow xy creep like a microscope stage
    const driftX = Math.sin(t * 0.4) * 3
    const driftY = Math.cos(t * 0.3) * 2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Circular field of view (eyepiece aperture) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at center, transparent 38%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.6) 72%, #000 85%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Specimen layer with stage drift */}
        <svg
          width={width}
          height={height}
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate(${driftX}px, ${driftY}px)`,
          }}
        >
          {/* Cell outlines — stained specimen */}
          {cells.map((c, i) => (
            <ellipse
              key={`cell-${i}`}
              cx={c.x}
              cy={c.y}
              rx={c.rx}
              ry={c.ry}
              transform={`rotate(${c.rot} ${c.x} ${c.y})`}
              fill={`rgba(100,60,140,${c.o})`}
              stroke={`rgba(140,80,180,${c.o * 0.6})`}
              strokeWidth={0.6}
            />
          ))}

          {/* Crosshair reticle */}
          <line
            x1={width / 2 - 30}
            y1={height / 2}
            x2={width / 2 + 30}
            y2={height / 2}
            stroke="rgba(200,200,200,0.08)"
            strokeWidth={0.5}
          />
          <line
            x1={width / 2}
            y1={height / 2 - 30}
            x2={width / 2}
            y2={height / 2 + 30}
            stroke="rgba(200,200,200,0.08)"
            strokeWidth={0.5}
          />

          {/* Scale bar */}
          <line
            x1={width - 70}
            y1={height - 25}
            x2={width - 20}
            y2={height - 25}
            stroke="rgba(200,200,200,0.18)"
            strokeWidth={1.5}
          />
          <text
            x={width - 45}
            y={height - 14}
            fill="rgba(200,200,200,0.15)"
            fontSize={7}
            fontFamily="monospace"
            textAnchor="middle"
          >
            50 um
          </text>
        </svg>

        {/* Objective info overlay */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: 'monospace',
            fontSize: 7,
            color: 'rgba(180,160,220,0.22)',
            letterSpacing: 1,
            lineHeight: '11px',
            zIndex: 3,
          }}
        >
          <div>OBJ: 40x / 0.65 NA</div>
          <div>STAIN: H&E</div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            fontFamily: 'monospace',
            fontSize: 7,
            color: 'rgba(180,160,220,0.2)',
            zIndex: 3,
          }}
        >
          BRIGHTFIELD
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
    index,
    frame,
  }: WordRenderProps) => {
    const letters = word.split('')
    const fontSize = Math.min(width / (letters.length * 0.65), 120)
    const totalWidth = letters.length * fontSize * 0.65
    const startX = (width - totalWidth) / 2
    const f = frame ?? 0

    if (phase === 'enter') {
      // Focus rack: all letters start blurred (out-of-focus), then snap into focus
      // with staggered timing — center letters focus first, edges follow (like a lens)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {letters.map((letter, i) => {
            // Center-out focus: letters closer to center focus first
            const centerDist = Math.abs(i - (letters.length - 1) / 2) / (letters.length / 2)
            const delay = centerDist * 0.4
            const charT = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))

            // Focus phases: rack through blur -> overshoot -> settle
            const focusT = easeOutBack(charT)
            const blurAmt = Math.max(0, (1 - focusT) * 12)

            // Scale oscillation — simulates focus breathing
            const scale = 1 + (1 - charT) * 0.15 - Math.sin(charT * Math.PI) * 0.03
            const opacity = easeOutQuart(Math.min(1, charT * 1.5))

            // Chromatic aberration during blur (slight color fringing)
            const aberration = (1 - charT) * 2

            return (
              <div key={i} style={{ position: 'absolute', left: startX + i * fontSize * 0.65, top: '50%' }}>
                {/* Red fringe (chromatic aberration) */}
                {aberration > 0.3 && (
                  <div
                    style={{
                      position: 'absolute',
                      transform: `translateY(-50%) translate(${aberration}px, ${-aberration * 0.5}px) scale(${scale})`,
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                      fontWeight: 700,
                      color: 'rgba(200,80,80,0.15)',
                      filter: `blur(${blurAmt + 2}px)`,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                    }}
                  >
                    {letter}
                  </div>
                )}
                {/* Blue fringe (chromatic aberration) */}
                {aberration > 0.3 && (
                  <div
                    style={{
                      position: 'absolute',
                      transform: `translateY(-50%) translate(${-aberration}px, ${aberration * 0.5}px) scale(${scale})`,
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                      fontWeight: 700,
                      color: 'rgba(80,80,200,0.15)',
                      filter: `blur(${blurAmt + 2}px)`,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                    }}
                  >
                    {letter}
                  </div>
                )}
                {/* Main letter */}
                <div
                  style={{
                    transform: `translateY(-50%) scale(${scale})`,
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                    fontWeight: 700,
                    color,
                    opacity,
                    filter: `blur(${blurAmt}px)`,
                    textShadow: charT > 0.8
                      ? `0 0 4px rgba(180,160,220,${(charT - 0.8) * 1.5})`
                      : 'none',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                  }}
                >
                  {letter}
                </div>
              </div>
            )
          })}
        </div>
      )
    } else if (phase === 'hold') {
      // In-focus hold: subtle focus breathing + stage micro-drift
      const breatheBlur = Math.sin(holdProgress * Math.PI * 5) * 0.3
      const driftX = Math.sin(f * 0.08) * 1.2
      const driftY = Math.cos(f * 0.06) * 0.8

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {letters.map((letter, i) => {
            // Subtle per-character focus shimmer
            const charShimmer = Math.sin(holdProgress * Math.PI * 8 + i * 2.1) * 0.15

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: startX + i * fontSize * 0.65 + driftX,
                  top: '50%',
                  transform: `translateY(calc(-50% + ${driftY}px))`,
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color,
                  opacity: 0.95 + charShimmer * 0.05,
                  filter: `blur(${Math.abs(breatheBlur)}px)`,
                  textShadow: `0 0 6px rgba(180,160,220,0.2)`,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                }}
              >
                {letter}
              </div>
            )
          })}

          {/* Magnification indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '16%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'monospace',
              fontSize: 8,
              color: `${color}35`,
              letterSpacing: 2,
            }}
          >
            40x // FOCUS LOCK // {word}
          </div>
        </div>
      )
    } else {
      // Exit: rack focus OUT — letters blur outward from center (reverse of enter)
      // Simulates turning the fine focus knob away

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {letters.map((letter, i) => {
            // Center-out defocus: center blurs first
            const centerDist = Math.abs(i - (letters.length - 1) / 2) / (letters.length / 2)
            const delay = (1 - centerDist) * 0.3
            const charT = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
            const defocusT = easeInCubic(charT)

            const blurAmt = defocusT * 14
            const scale = 1 + defocusT * 0.12
            const opacity = 1 - easeInCubic(charT)
            const aberration = defocusT * 2.5

            return (
              <div key={i} style={{ position: 'absolute', left: startX + i * fontSize * 0.65, top: '50%' }}>
                {/* Chromatic aberration returning */}
                {aberration > 0.5 && (
                  <div
                    style={{
                      position: 'absolute',
                      transform: `translateY(-50%) translate(${aberration}px, 0) scale(${scale})`,
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                      fontWeight: 700,
                      color: 'rgba(200,80,80,0.12)',
                      filter: `blur(${blurAmt + 3}px)`,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                    }}
                  >
                    {letter}
                  </div>
                )}
                {aberration > 0.5 && (
                  <div
                    style={{
                      position: 'absolute',
                      transform: `translateY(-50%) translate(${-aberration}px, 0) scale(${scale})`,
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                      fontWeight: 700,
                      color: 'rgba(80,80,200,0.12)',
                      filter: `blur(${blurAmt + 3}px)`,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                    }}
                  >
                    {letter}
                  </div>
                )}
                <div
                  style={{
                    transform: `translateY(-50%) scale(${scale})`,
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                    fontWeight: 700,
                    color,
                    opacity,
                    filter: `blur(${blurAmt}px)`,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                  }}
                >
                  {letter}
                </div>
              </div>
            )
          })}
        </div>
      )
    }
  },
}

function MicroscopeFocusComponent(props: MotionGraphicProps<MicroscopeFocusConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-microscope-focus',
  title: 'Kinetic Microscope Focus',
  description:
    'Microscope focus rack — letters start blurred and snap into focus center-outward with chromatic aberration fringing, through a circular eyepiece aperture. Cell specimen background with scale bar and crosshair reticle. Exit racks focus out.',
  tags: [
    'kinetic',
    'typography',
    'microscope',
    'medical',
    'focus',
    'lens',
    'science',
    'lab',
    'specimen',
    'optics',
  ],
  category: 'captions',
  component: MicroscopeFocusComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'CELL', 'STAIN', 'SLIDE'],
    colors: ['#D8C8F0', '#C4B0E8', '#E0D4F4', '#CCB8EC'],
    bgColor: '#0A0810',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FOCUS', 'CELL', 'STAIN', 'SLIDE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#D8C8F0', '#C4B0E8', '#E0D4F4', '#CCB8EC'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0810', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
