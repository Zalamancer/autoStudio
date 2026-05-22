import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BiohazardConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Pressure gauge needle rotation
    const gaugeAngle = Math.sin(time * 0.6) * 30 + 45
    // Decontamination amber pulse
    const deconPulse = Math.sin(time * 3) * 0.5 + 0.5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Decontamination yellow ambient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(200,180,0,${0.04 + deconPulse * 0.03}), transparent 65%)`,
          }}
        />
        {/* Biohazard trefoil symbol (centered, large, subtle) */}
        <svg
          width={Math.min(width, height) * 0.7}
          height={Math.min(width, height) * 0.7}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${time * 2}deg)`,
            opacity: 0.06 + deconPulse * 0.02,
          }}
          viewBox="0 0 200 200"
        >
          {/* Three crescents of biohazard symbol */}
          {[0, 120, 240].map((rot, i) => (
            <g key={i} transform={`rotate(${rot} 100 100)`}>
              <path
                d="M 100 30 A 40 40 0 0 1 130 75 A 25 25 0 0 0 100 65 A 25 25 0 0 0 70 75 A 40 40 0 0 1 100 30 Z"
                fill="#FFD000"
              />
            </g>
          ))}
          {/* Center ring */}
          <circle cx="100" cy="100" r="18" fill="none" stroke="#FFD000" strokeWidth="4" />
          <circle cx="100" cy="100" r="8" fill="#FFD000" />
        </svg>
        {/* Sealed lab door frame lines */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '5%',
            right: '5%',
            bottom: '5%',
            border: '2px solid rgba(200,180,0,0.1)',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
        {/* Corner seal indicators */}
        {[
          { top: '5%', left: '5%' },
          { top: '5%', right: '5%' },
          { bottom: '5%', left: '5%' },
          { bottom: '5%', right: '5%' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: `rgba(200,180,0,${0.15 + deconPulse * 0.1})`,
              boxShadow: `0 0 6px rgba(200,180,0,${deconPulse * 0.3})`,
            } as any}
          />
        ))}
        {/* Pressure gauge (bottom right) */}
        <svg
          width={50}
          height={50}
          style={{ position: 'absolute', bottom: '10%', right: '10%', opacity: 0.2 }}
          viewBox="0 0 50 50"
        >
          <circle cx="25" cy="25" r="22" fill="none" stroke="#FFD000" strokeWidth="1.5" />
          <line
            x1="25"
            y1="25"
            x2={25 + Math.cos((gaugeAngle - 90) * Math.PI / 180) * 16}
            y2={25 + Math.sin((gaugeAngle - 90) * Math.PI / 180) * 16}
            stroke="#FFD000"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="25" cy="25" r="3" fill="#FFD000" />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 53 + 7
    let opacity = 0
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      // Decontamination reveal — emerges through haze
      opacity = Math.min(1, enterProgress * 1.4)
      blur = (1 - enterProgress) * 6
      scale = 0.92 + enterProgress * 0.08
    } else if (phase === 'hold') {
      opacity = 1
      // Containment pressure pulse
      scale = 1 + Math.sin(f * 0.4 + seed) * 0.01
    } else {
      opacity = 1 - exitProgress
      blur = exitProgress * 8
      scale = 1 - exitProgress * 0.08
    }

    return (
      <>
        {/* Contamination glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color: 'rgba(255,200,0,0.2)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 6,
            opacity: opacity * 0.6,
            filter: 'blur(14px)',
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 6,
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            textShadow: `0 0 10px rgba(255,200,0,0.4), 0 0 30px rgba(200,180,0,0.15)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function BiohazardComponent(props: MotionGraphicProps<BiohazardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-biohazard',
  title: 'Kinetic Biohazard',
  description: 'Biohazard containment with rotating trefoil symbol, decontamination yellow pulse, sealed lab door frame, and pressure gauge animation',
  tags: ['kinetic', 'typography', 'biohazard', 'containment', 'lab', 'hazmat', 'warning', 'science'],
  category: 'captions',
  component: BiohazardComponent as any,
  defaultConfig: {
    words: ['CONTAIN', 'HAZMAT', 'SEALED', 'BREACH'],
    colors: ['#FFD000', '#FFD000', '#FFD000', '#FF4444'],
    bgColor: '#0d0d08',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CONTAIN', 'HAZMAT', 'SEALED', 'BREACH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD000', '#FFD000', '#FFD000', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
