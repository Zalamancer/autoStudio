import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface UVUnwrapConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// UV unwrap: texture coordinates misaligned — letters appear "unfolded" from a 3D surface
// Seams, stretching, and UV island boundaries visible

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // UV grid — checkerboard test pattern used for UV verification
    const gridSize = 20
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* UV checkerboard (very faint) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-conic-gradient(rgba(80,80,120,0.04) 0% 25%, transparent 0% 50%)`,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
        {/* UV seam lines */}
        <div
          style={{
            position: 'absolute',
            left: '30%',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(255,120,0,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '70%',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(255,120,0,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,120,0,0.08)',
          }}
        />
        {/* UV coord readout */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,120,0,0.2)',
            letterSpacing: 1,
          }}
        >
          U: {(0.5 + Math.sin(time * 1.2) * 0.3).toFixed(3)} V: {(0.5 + Math.cos(time * 0.9) * 0.3).toFixed(3)}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(120,200,255,0.15)',
          }}
        >
          ISLAND: 3/7 SEAM OVERLAP DETECTED
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 137 + 59
    const chars = word.split('')

    // UV unwrap: each character comes from a different UV island
    // On enter: characters slide in from their "unfolded" positions
    // On hold: slight UV stretch distortion
    // On exit: unfolds back out

    const getUVOffset = (ci: number, progress: number) => {
      // Each char has a random UV island offset that reduces to 0 at full progress
      const uvX = (rand(seed + ci * 31) - 0.5) * 80 * (1 - progress)
      const uvY = (rand(seed + ci * 47 + 5) - 0.5) * 60 * (1 - progress)
      const uvRot = (rand(seed + ci * 23 + 11) - 0.5) * 40 * (1 - progress)
      return { uvX, uvY, uvRot }
    }

    if (phase === 'enter') {
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            const { uvX, uvY, uvRot } = getUVOffset(ci, enterProgress)
            return (
              <span
                key={ci}
                style={{
                  color,
                  display: 'inline-block',
                  transform: `translate(${uvX}px, ${uvY}px) rotate(${uvRot}deg)`,
                  opacity: 0.2 + enterProgress * 0.8,
                  // UV stretch: slight skew based on island position
                  filter: enterProgress < 0.7 ? `blur(${(1 - enterProgress) * 1.5}px)` : 'none',
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      // Gentle UV stretch pulsing — texture appears slightly stretched
      const stretchX = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.03
      const stretchY = 1 - Math.sin(holdProgress * Math.PI * 3) * 0.02
      // Seam flash: UV seam briefly becomes visible on text
      const seamFlash = holdProgress > 0.5 && holdProgress < 0.55

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${stretchX}) scaleY(${stretchY})`,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color: seamFlash ? '#FF6600' : color,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            textShadow: seamFlash ? '2px 0 #FF6600, -2px 0 #0066FF' : `0 0 8px ${color}40`,
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: re-unfold — chars fly back to UV islands
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 160px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
          display: 'flex',
        }}
      >
        {chars.map((ch, ci) => {
          const { uvX, uvY, uvRot } = getUVOffset(ci, 1 - exitProgress)
          return (
            <span
              key={ci}
              style={{
                color,
                display: 'inline-block',
                transform: `translate(${uvX}px, ${uvY}px) rotate(${uvRot}deg)`,
                opacity: 1 - exitProgress * 0.8,
              }}
            >
              {ch}
            </span>
          )
        })}
      </div>
    )
  },
}

function UVUnwrapComponent(props: MotionGraphicProps<UVUnwrapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-uv-unwrap',
  title: 'Kinetic UV Unwrap',
  description:
    'GPU texture UV unwrap glitch — letters assemble from scattered UV islands with checkerboard test pattern and seam detection overlay',
  tags: ['kinetic', 'typography', 'glitch', 'gpu', 'render', 'uv', '3d', 'texture', 'digital'],
  category: 'captions',
  component: UVUnwrapComponent as any,
  defaultConfig: {
    words: ['TEXTURE', 'SEAM', 'ISLAND', 'UNWRAP'],
    colors: ['#FF6600', '#FF8800', '#FFAA00', '#FF6600'],
    bgColor: '#0a0810',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['TEXTURE', 'SEAM', 'ISLAND', 'UNWRAP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6600', '#FF8800', '#FFAA00', '#FF6600'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0810', group: 'Style' },
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
