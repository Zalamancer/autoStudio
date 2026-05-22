import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FigmaLayerConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const LAYER_NAMES = ['Frame 1', 'Group 2', 'Auto Layout', 'Component', 'Vector', 'Text']
const LAYER_ICONS = ['▣', '⊞', '⊟', '◈', '⬠', 'T']
const LAYER_DEPTHS = [0, 1, 2, 1, 2, 3]
const LAYER_COLORS = ['#A259FF', '#1ABCFE', '#0ACF83', '#FF7262', '#A259FF', '#1ABCFE']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Figma left panel chrome */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(38,38,38,0.6) 0%, transparent 40%)',
          pointerEvents: 'none',
        }}
      />
      {/* Panel header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'clamp(20px, 4vw, 32px)',
          background: 'rgba(30,30,30,0.9)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 'clamp(8px, 2vw, 16px)',
          gap: 'clamp(6px, 1.5vw, 12px)',
        }}
      >
        {['Layers', 'Assets', 'Pages'].map((tab, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(6px, 1.1vw, 9px)',
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
              borderBottom: i === 0 ? '1px solid #A259FF' : 'none',
              paddingBottom: 2,
            }}
          >
            {tab}
          </span>
        ))}
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const ep = easeOutExpo(Math.min(1, enterProgress * 1.3))
    const bp = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.5) / 0.5)))

    const panelW = Math.min(width * 0.55, 260)
    const rowH = Math.min(height * 0.1, 28)
    const panelX = (width - panelW) / 2
    const panelY = (height - LAYER_NAMES.length * (rowH + 2)) / 2

    const nodes: React.ReactNode[] = []

    // Layer rows slide in staggered
    LAYER_NAMES.forEach((name, i) => {
      const delay = i * 0.08
      const rowP = easeOutExpo(Math.min(1, Math.max(0, (enterProgress - delay) / 0.3)))
      const isSelected = i === (index % LAYER_NAMES.length)
      const slideX = (1 - rowP) * -40
      const rowOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 2) : rowP

      nodes.push(
        <div
          key={`layer-${i}`}
          style={{
            position: 'absolute',
            left: panelX + slideX,
            top: panelY + i * (rowH + 2),
            width: panelW,
            height: rowH,
            background: isSelected ? 'rgba(162,89,255,0.25)' : 'transparent',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: `${8 + LAYER_DEPTHS[i] * 12}px`,
            gap: 6,
            opacity: rowOpacity,
            border: isSelected ? '1px solid rgba(162,89,255,0.4)' : '1px solid transparent',
          }}
        >
          <span style={{ fontSize: 'clamp(7px, 1.3vw, 10px)', color: LAYER_COLORS[i], opacity: 0.9 }}>
            {LAYER_ICONS[i]}
          </span>
          <span
            style={{
              fontFamily: '"SF Mono", "Fira Code", monospace',
              fontSize: 'clamp(6px, 1.2vw, 10px)',
              color: isSelected ? '#fff' : 'rgba(255,255,255,0.55)',
              fontWeight: isSelected ? 600 : 400,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {isSelected ? word : name}
          </span>
          {/* Visibility eye icon */}
          <span style={{ fontSize: 'clamp(5px, 0.9vw, 8px)', color: 'rgba(255,255,255,0.25)', marginRight: 6 }}>
            ◉
          </span>
        </div>,
      )
    })

    // Main word bursts from selected layer with Figma purple glow
    const wordScale = phase === 'enter' ? easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.4) / 0.6))) : phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : 1
    const wordOpacity = phase === 'enter' ? Math.min(1, Math.max(0, (enterProgress - 0.35) * 4)) : phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : 1
    // Gentle float during hold
    const floatY = phase === 'hold' ? Math.sin(f * 0.07) * 3 : 0

    nodes.push(
      <div
        key="word"
        style={{
          position: 'absolute',
          bottom: '14%',
          left: '50%',
          transform: `translateX(-50%) translateY(${floatY}px) scale(${wordScale})`,
          opacity: wordOpacity,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: 'clamp(32px, 8vw, 110px)',
            fontWeight: 800,
            color,
            textShadow: `0 0 30px ${color}88, 0 0 60px ${color}44`,
            letterSpacing: -1,
          }}
        >
          {word}
        </div>
      </div>,
    )

    return <>{nodes}</>
  },
}

function FigmaLayerComponent(props: MotionGraphicProps<FigmaLayerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-figma-layer',
  title: 'Kinetic Figma Layer',
  description:
    'Figma layers panel slides open with staggered layer rows, the selected layer highlights with a purple glow, then the word bursts out with elastic scale',
  tags: ['kinetic', 'typography', 'figma', 'design', 'layers', 'ui', 'creator', 'tool', 'digital-native'],
  category: 'captions',
  component: FigmaLayerComponent as any,
  defaultConfig: {
    words: ['DESIGN', 'CREATE', 'BUILD', 'SHIP'],
    colors: ['#A259FF', '#1ABCFE', '#0ACF83', '#FF7262'],
    bgColor: '#1E1E1E',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DESIGN', 'CREATE', 'BUILD', 'SHIP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A259FF', '#1ABCFE', '#0ACF83', '#FF7262'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1E1E1E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
