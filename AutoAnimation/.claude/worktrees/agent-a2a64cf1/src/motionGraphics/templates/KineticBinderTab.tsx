import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BinderTabConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Classic binder divider tab colors
const tabColors = [
  { tab: '#E8543A', text: '#FFFFFF', page: '#FFF8F6' },
  { tab: '#3A78E8', text: '#FFFFFF', page: '#F6F8FF' },
  { tab: '#3ABB6A', text: '#FFFFFF', page: '#F6FFF9' },
  { tab: '#E8B83A', text: '#1A1A1A', page: '#FFFBF0' },
  { tab: '#9B3AE8', text: '#FFFFFF', page: '#FAF6FF' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle ring binder paper look */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(100,140,200,0.1) 27px, rgba(100,140,200,0.1) 28px)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
      {/* Left margin red line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '8%',
          width: 1,
          background: 'rgba(220,100,100,0.2)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 43 + 17
    const scheme = tabColors[index % tabColors.length]

    let translateX = 0
    let opacity = 1
    let tabScaleX = 1
    let tabScaleY = 1

    if (phase === 'enter') {
      // Tab and page slide in from the right, tab pops up last
      const pageEased = easeOutCubic(Math.min(1, enterProgress * 1.2))
      const tabEased = easeOutBack(Math.max(0, (enterProgress - 0.2) / 0.8))
      translateX = (1 - pageEased) * 350
      tabScaleX = tabEased
      tabScaleY = tabEased
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'hold') {
      // Micro-float
      translateX = Math.sin(holdProgress * Math.PI * 2 + seed) * 1.5
    } else {
      // Slides back off to the right
      const eased = easeInCubic(exitProgress)
      translateX = eased * 380
      opacity = 1 - exitProgress * 0.85
      if (exitProgress > 0.8) opacity = (1 - exitProgress) / 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%)`,
          opacity,
        }}
      >
        <div style={{ position: 'relative' }}>
          {/* Colored binder tab — sticks up above the page body */}
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              height: 'clamp(28px, 5vw, 52px)',
              minWidth: 'clamp(80px, 16vw, 160px)',
              background: scheme.tab,
              borderRadius: '6px 6px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scaleX(${tabScaleX}) scaleY(${tabScaleY})`,
              transformOrigin: 'right bottom',
              boxShadow: '0 -2px 6px rgba(0,0,0,0.12)',
            }}
          >
            <div
              style={{
                fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(10px, 2vw, 18px)',
                fontWeight: 700,
                color: scheme.text,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {word.substring(0, 6)}
            </div>
          </div>

          {/* Divider page body */}
          <div
            style={{
              background: scheme.page,
              padding: 'clamp(18px, 4vw, 44px) clamp(24px, 6vw, 64px)',
              boxShadow: '3px 4px 16px rgba(0,0,0,0.14)',
              borderRadius: '0 0 2px 2px',
              borderTop: `3px solid ${scheme.tab}`,
              minWidth: 'clamp(200px, 42vw, 500px)',
            }}
          >
            <div
              style={{
                fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(34px, 8.5vw, 112px)',
                fontWeight: 800,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: '0.03em',
              }}
            >
              {word}
            </div>
          </div>
        </div>
      </div>
    )
  },
}

function BinderTabComponent(props: MotionGraphicProps<BinderTabConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-binder-tab',
  title: 'Kinetic Binder Tab',
  description:
    'Text appears on a colored binder divider tab — page slides in from the right with the tab popping into position',
  tags: ['kinetic', 'typography', 'binder', 'tab', 'divider', 'office', 'school', 'stationery', 'organize'],
  category: 'captions',
  component: BinderTabComponent as any,
  defaultConfig: {
    words: ['CHAPTER', 'SECTION', 'NOTES', 'UNIT'],
    colors: ['#1A1A2E', '#0D2137', '#1A0D37', '#201A0D'],
    bgColor: '#E8E4DC',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CHAPTER', 'SECTION', 'NOTES', 'UNIT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#1A1A2E', '#0D2137', '#1A0D37', '#201A0D'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8E4DC', group: 'Style' },
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
