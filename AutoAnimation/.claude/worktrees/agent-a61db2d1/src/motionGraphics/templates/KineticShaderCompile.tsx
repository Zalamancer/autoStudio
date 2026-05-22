import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShaderCompileConfig extends KineticBaseConfig {}

// Shader compile error: GLSL compilation artifacts
// Text renders through shader stages: vertex → fragment → output
// Partial renders, color channel isolation, and compilation progress

const SHADER_LINES = [
  'varying vec2 vUv;',
  'uniform sampler2D tDiffuse;',
  'void main() {',
  '  vec4 c = texture2D(tDiffuse, vUv);',
  '  gl_FragColor = vec4(c.rgb, 1.0);',
  '}',
  'ERROR: undeclared identifier',
  'LINK: fragment shader failed',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const lineIdx = Math.floor(time * 1.5) % SHADER_LINES.length

    // Compilation progress
    const compileProgress = (time % 4) / 4
    const compiling = compileProgress < 0.7
    const hasError = compileProgress > 0.65 && compileProgress < 0.75

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Shader source lines scrolling */}
        {SHADER_LINES.slice(0, 5).map((line, i) => {
          const isActive = i === lineIdx % 5
          const isError = line.startsWith('ERROR') || line.startsWith('LINK')
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 10,
                top: 8 + i * 11,
                fontFamily: "'Courier New', monospace",
                fontSize: 7,
                color: isActive ? 'rgba(100,220,255,0.3)' : isError ? 'rgba(255,60,60,0.2)' : 'rgba(180,180,255,0.08)',
                letterSpacing: 0.5,
              }}
            >
              {line}
            </div>
          )
        })}
        {/* Compile progress bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 10,
            right: 10,
            height: 2,
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${compileProgress * 100}%`,
              background: hasError ? '#FF4444' : compileProgress > 0.7 ? '#44FF88' : '#4488FF',
              transition: 'background 0.2s',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 5,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: hasError ? 'rgba(255,60,60,0.4)' : 'rgba(100,200,255,0.2)',
          }}
        >
          {hasError
            ? 'GLSL COMPILE ERROR (stage: fragment)'
            : compiling
              ? `Compiling shader... ${Math.floor((compileProgress / 0.7) * 100)}%`
              : 'LINKED OK'}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Shader compile stages: vertex pass (enter), fragment pass (hold), output (full)
    // Each stage applies different rendering artifacts

    if (phase === 'enter') {
      // Vertex shader pass: geometry correct but no color/texture — grey flat render
      // Then fragment shader kicks in and color fills
      const vertexDone = enterProgress > 0.4
      const fragmentProgress = Math.max(0, (enterProgress - 0.4) / 0.6)

      // Fragment compile: channels compile one at a time R→G→B
      const rDone = fragmentProgress > 0.2
      const gDone = fragmentProgress > 0.5
      const bDone = fragmentProgress > 0.8

      const r = rDone ? 'FF' : '00'
      const g = gDone ? 'FF' : '00'
      const b = bDone ? 'FF' : '00'
      const channelColor = vertexDone && !gDone ? `#${r}${g}${b}` : color

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            color: vertexDone ? (fragmentProgress > 0.9 ? color : channelColor) : 'rgba(160,160,160,0.4)',
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            opacity: 0.1 + enterProgress * 0.9,
            // Fragment compile: scanline wipe from top reveals full color
            WebkitMaskImage:
              vertexDone && fragmentProgress < 1
                ? `linear-gradient(to bottom, ${color} ${fragmentProgress * 120}%, transparent ${fragmentProgress * 120}%)`
                : 'none',
            textShadow: fragmentProgress > 0.9 ? `0 0 8px ${color}60` : 'none',
          }}
        >
          {word}
        </div>
      )
    }

    if (phase === 'hold') {
      // Fully compiled but occasional re-link glitch
      const relinkGlitch = holdProgress > 0.55 && holdProgress < 0.62
      const channelSplit = relinkGlitch

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textShadow: channelSplit
              ? `3px 0 rgba(255,0,0,0.7), -3px 0 rgba(0,100,255,0.7), 0 0 12px ${color}`
              : `0 0 8px ${color}50`,
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: de-link shader — color drains R→G→B→grey→invisible
    const drainProgress = exitProgress

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 10vw, 150px)',
          fontWeight: 700,
          color: drainProgress > 0.5 ? `rgba(160,160,160,${1 - (drainProgress - 0.5) * 2})` : color,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          opacity: drainProgress > 0.5 ? 1 : 1 - drainProgress * 0.3,
          filter: drainProgress > 0.3 ? `grayscale(${Math.min(1, (drainProgress - 0.3) / 0.4)})` : 'none',
        }}
      >
        {word}
      </div>
    )
  },
}

function ShaderCompileComponent(props: MotionGraphicProps<ShaderCompileConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shader-compile',
  title: 'Kinetic Shader Compile',
  description:
    'GLSL shader compilation sequence — text renders through vertex/fragment stages with channel-by-channel color compilation, compile progress bar, and re-link glitches',
  tags: ['kinetic', 'typography', 'glitch', 'gpu', 'render', 'shader', 'glsl', 'digital', 'tech'],
  category: 'captions',
  component: ShaderCompileComponent as any,
  defaultConfig: {
    words: ['COMPILE', 'LINK', 'RENDER', 'OUTPUT'],
    colors: ['#44AAFF', '#55BBFF', '#44AAFF', '#88CCFF'],
    bgColor: '#03080f',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['COMPILE', 'LINK', 'RENDER', 'OUTPUT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#44AAFF', '#55BBFF', '#44AAFF', '#88CCFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#03080f', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
