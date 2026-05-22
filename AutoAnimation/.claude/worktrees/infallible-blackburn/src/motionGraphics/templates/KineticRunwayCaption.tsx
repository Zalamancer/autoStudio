import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RunwayCaptionConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Minimal corner marks -- fashion show screen overlay */}
      {[
        { top: '6%', left: '6%' },
        { top: '6%', right: '6%' },
        { bottom: '6%', left: '6%' },
        { bottom: '6%', right: '6%' },
      ].map((pos, i) => (
        <div key={i} style={{ position: 'absolute', ...pos, width: 16, height: 16 }}>
          <div
            style={{
              position: 'absolute',
              [pos.top ? 'top' : 'bottom']: 0,
              [pos.left ? 'left' : 'right']: 0,
              width: 16,
              height: 0.5,
              background: 'rgba(255,255,255,0.12)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              [pos.top ? 'top' : 'bottom']: 0,
              [pos.left ? 'left' : 'right']: 0,
              width: 0.5,
              height: 16,
              background: 'rgba(255,255,255,0.12)',
            }}
          />
        </div>
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Parse word as "Name | Designer | Season" or show as-is
    const parts = word.split('|').map((s) => s.trim())
    const modelName = parts[0] || word
    const designer = parts[1] || ''
    const season = parts[2] || ''

    let opacity = 0
    let translateX = 0
    let lineWidth = 0

    if (phase === 'enter') {
      // Slide in from left with stagger
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = Math.min(1, enterProgress * 3)
      translateX = (1 - eased) * -40
      lineWidth = eased * 100
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
      lineWidth = 100
    } else {
      // Slide out to right
      const eased = exitProgress * exitProgress
      opacity = 1 - exitProgress
      translateX = eased * 40
      lineWidth = (1 - exitProgress) * 100
    }

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '8%',
          transform: `translateX(${translateX}px)`,
          opacity,
        }}
      >
        {/* Model name -- large minimal sans */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Inter', 'Arial', sans-serif",
            fontSize: 'clamp(28px, 8vw, 90px)',
            fontWeight: 200,
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            color,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {modelName}
        </div>
        {/* Thin separator line */}
        <div
          style={{
            width: `${lineWidth}%`,
            maxWidth: 200,
            height: 0.5,
            background: color,
            opacity: 0.4,
            margin: '10px 0',
          }}
        />
        {/* Designer & season -- small caps */}
        <div style={{ display: 'flex', gap: '2em', alignItems: 'center' }}>
          {designer && (
            <div
              style={{
                fontFamily: "'Helvetica Neue', 'Inter', 'Arial', sans-serif",
                fontSize: 'clamp(10px, 2.5vw, 22px)',
                fontWeight: 300,
                textTransform: 'uppercase',
                letterSpacing: '0.35em',
                color,
                opacity: 0.7,
                whiteSpace: 'nowrap',
              }}
            >
              {designer}
            </div>
          )}
          {season && (
            <div
              style={{
                fontFamily: "'Helvetica Neue', 'Inter', 'Arial', sans-serif",
                fontSize: 'clamp(10px, 2.5vw, 22px)',
                fontWeight: 300,
                textTransform: 'uppercase',
                letterSpacing: '0.35em',
                color,
                opacity: 0.4,
                whiteSpace: 'nowrap',
              }}
            >
              {season}
            </div>
          )}
        </div>
        {/* Look number */}
        <div
          style={{
            position: 'absolute',
            top: '-1.2em',
            left: 0,
            fontFamily: "'Helvetica Neue', 'Inter', 'Arial', sans-serif",
            fontSize: 'clamp(8px, 1.8vw, 14px)',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.4em',
            color,
            opacity: 0.3,
            whiteSpace: 'nowrap',
          }}
        >
          Look {String(index + 1).padStart(2, '0')}
        </div>
      </div>
    )
  },
}

function KineticRunwayCaptionComponent(props: MotionGraphicProps<RunwayCaptionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-runway-caption',
  title: 'Runway Caption',
  description: 'Fashion runway caption with model name, designer, and season. Minimal sans-serif, left-aligned with look number.',
  tags: ['kinetic', 'typography', 'fashion', 'runway', 'caption', 'minimal', 'model', 'designer'],
  category: 'captions',
  component: KineticRunwayCaptionComponent as any,
  defaultConfig: {
    words: ['Bella Hadid | Valentino | FW26', 'Kaia Gerber | Chanel | SS26', 'Adut Akech | Dior | Couture', 'Vittoria Ceretti | Prada | Resort'],
    colors: ['#FAFAFA', '#FAFAFA', '#FAFAFA', '#FAFAFA'],
    bgColor: '#0a0a0a',
    cycleDuration: 2,
  },
  configSchema: [
    { key: 'words', label: 'Captions (Name | Designer | Season)', type: 'text-array', defaultValue: ['Bella Hadid | Valentino | FW26', 'Kaia Gerber | Chanel | SS26', 'Adut Akech | Dior | Couture', 'Vittoria Ceretti | Prada | Resort'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FAFAFA', '#FAFAFA', '#FAFAFA', '#FAFAFA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
