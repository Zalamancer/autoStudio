import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ValveOpenConfig extends KineticBaseConfig {
  pipeColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Valve / tap opening: circular gate rotates open, text flows through like water
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const config = (globalThis as any).__valveConfig ?? { pipeColor: '#6a8090' }
    const pipeColor = config.pipeColor ?? '#6a8090'

    const pipeH = Math.round(height * 0.22)
    const pipeY = Math.round((height - pipeH) / 2)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Horizontal pipe left */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: pipeY,
            width: '35%',
            height: pipeH,
            background: `linear-gradient(180deg, ${pipeColor}CC 0%, ${pipeColor}66 40%, ${pipeColor}99 100%)`,
            borderRadius: '2px 0 0 2px',
          }}
        />
        {/* Pipe right */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: pipeY,
            width: '35%',
            height: pipeH,
            background: `linear-gradient(180deg, ${pipeColor}CC 0%, ${pipeColor}66 40%, ${pipeColor}99 100%)`,
            borderRadius: '0 2px 2px 0',
          }}
        />
        {/* Valve body circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: Math.min(width, height) * 0.42,
            height: Math.min(width, height) * 0.42,
            borderRadius: '50%',
            border: `4px solid ${pipeColor}`,
            background: bgColor,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__valveConfig ?? { pipeColor: '#6a8090' }
    const pipeColor = config.pipeColor ?? '#6a8090'

    // Valve opens: gate polygon rotates away, revealing text through pipe opening
    let openProgress = 0
    if (phase === 'enter') {
      openProgress = Math.min(1, easeOutBack(enterProgress))
    } else if (phase === 'hold') {
      openProgress = 1
    } else {
      openProgress = 1 - easeInOutCubic(exitProgress)
    }

    // Valve gate: two rectangular panels that slide apart vertically
    // At closed: both panels meet at center, fully blocking the pipe bore
    // At open: both panels retract to top/bottom, revealing text
    const pipeH = height * 0.22
    const pipeY = (height - pipeH) / 2
    const halfGap = (pipeH / 2) * openProgress
    const valveR = Math.min(width, height) * 0.21

    // Gate clips — top panel slides up, bottom panel slides down
    const gateTopBottom = pipeH / 2 - halfGap
    const topPanelClip = `polygon(0% ${(pipeY / height * 100).toFixed(1)}%, 100% ${(pipeY / height * 100).toFixed(1)}%, 100% ${((pipeY + gateTopBottom) / height * 100).toFixed(1)}%, 0% ${((pipeY + gateTopBottom) / height * 100).toFixed(1)}%)`
    const botPanelTop = pipeY + pipeH / 2 + halfGap
    const botPanelClip = `polygon(0% ${(botPanelTop / height * 100).toFixed(1)}%, 100% ${(botPanelTop / height * 100).toFixed(1)}%, 100% ${((pipeY + pipeH) / height * 100).toFixed(1)}%, 0% ${((pipeY + pipeH) / height * 100).toFixed(1)}%)`

    // Text visible in the open bore of the pipe (horizontal strip)
    const boreTop = pipeY + halfGap
    const boreBottom = pipeY + pipeH - halfGap
    const boreClip = openProgress > 0.005
      ? `polygon(0% ${(boreTop / height * 100).toFixed(2)}%, 100% ${(boreTop / height * 100).toFixed(2)}%, 100% ${(boreBottom / height * 100).toFixed(2)}%, 0% ${(boreBottom / height * 100).toFixed(2)}%)`
      : 'polygon(50% 50%, 50% 50%, 50% 50%)'

    // Valve handle rotation (the handwheel spokes spin as it opens)
    const handleAngle = openProgress * 180

    return (
      <>
        {/* Text revealed through pipe bore */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(32px, 9vw, 120px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            clipPath: boreClip,
          }}
        >
          {word}
        </div>
        {/* Gate panels */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: topPanelClip,
            background: `linear-gradient(180deg, ${pipeColor}DD, ${pipeColor}99)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: botPanelClip,
            background: `linear-gradient(0deg, ${pipeColor}DD, ${pipeColor}99)`,
          }}
        />
        {/* Valve handwheel overlay */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
        >
          <g transform={`translate(${width / 2}, ${height / 2}) rotate(${handleAngle})`}>
            {/* Rim */}
            <circle r={valveR} fill="none" stroke={pipeColor} strokeWidth={3} opacity={0.7} />
            {/* Spokes */}
            {[0, 60, 120].map((a) => {
              const rad = (a * Math.PI) / 180
              return (
                <line
                  key={a}
                  x1={Math.cos(rad) * valveR * 0.95}
                  y1={Math.sin(rad) * valveR * 0.95}
                  x2={Math.cos(rad + Math.PI) * valveR * 0.95}
                  y2={Math.sin(rad + Math.PI) * valveR * 0.95}
                  stroke={pipeColor}
                  strokeWidth={2}
                  opacity={0.6}
                />
              )
            })}
            {/* Hub */}
            <circle r={valveR * 0.1} fill={pipeColor} opacity={0.8} />
          </g>
        </svg>
      </>
    )
  },
}

function ValveOpenComponent(props: MotionGraphicProps<ValveOpenConfig>) {
  ;(globalThis as any).__valveConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-valve-open',
  title: 'Kinetic Valve Open',
  description: 'Industrial valve gate slides open as the handwheel turns, revealing text flowing through the pipe bore',
  tags: ['kinetic', 'typography', 'valve', 'pipe', 'industrial', 'gate', 'reveal', 'mechanical', 'aperture'],
  category: 'captions',
  component: ValveOpenComponent as any,
  defaultConfig: {
    words: ['FLOW', 'OPEN', 'FLUSH', 'RELEASE'],
    colors: ['#A8D8EA', '#87C4DD', '#C8E8F8', '#78B4CC'],
    bgColor: '#111820',
    cycleDuration: 1.5,
    pipeColor: '#6a8090',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FLOW', 'OPEN', 'FLUSH', 'RELEASE'],
      group: 'Content',
    },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#A8D8EA', '#87C4DD'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111820', group: 'Style' },
    { key: 'pipeColor', label: 'Pipe Color', type: 'color', defaultValue: '#6a8090', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
