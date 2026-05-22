import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlidingDoorsConfig extends KineticBaseConfig {
  panelCount: number
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInQuint(t: number): number {
  return t * t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__slidingDoorsConfig ?? { panelCount: 2 }
    const panelCount = Math.max(2, Math.min(6, config.panelCount ?? 2))

    let slideProgress = 0
    if (phase === 'enter') {
      slideProgress = easeOutQuint(enterProgress)
    } else if (phase === 'hold') {
      slideProgress = 1
    } else {
      slideProgress = 1 - easeInQuint(exitProgress)
    }

    const panelWidth = width / panelCount
    // Panels on the left half slide left, panels on right half slide right
    const maxSlide = width / 2 + panelWidth

    const panelElements = []
    for (let i = 0; i < panelCount; i++) {
      const isLeftHalf = i < panelCount / 2
      const slideDir = isLeftHalf ? -1 : 1
      // Stagger: inner panels move first
      const distFromCenter = isLeftHalf ? panelCount / 2 - 1 - i : i - panelCount / 2
      const staggerDelay = (distFromCenter / (panelCount / 2)) * 0.3
      const panelProgress = Math.max(0, Math.min(1, (slideProgress - staggerDelay) / (1 - staggerDelay * 0.7)))
      const eased = easeOutQuint(panelProgress)

      const translateX = slideDir * eased * maxSlide

      // Panel chrome: subtle gradient to give depth/metal feel
      const gradDir = isLeftHalf ? '90deg' : '270deg'
      const panelBg = `linear-gradient(${gradDir}, rgba(190,192,200,0.9) 0%, rgba(155,157,165,0.92) 60%, rgba(120,122,130,0.88) 100%)`

      panelElements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: i * panelWidth,
            width: panelWidth,
            height,
            transform: `translateX(${translateX}px)`,
            background: panelBg,
            borderLeft: '1px solid rgba(240,240,248,0.2)',
            borderRight: '1px solid rgba(80,82,90,0.3)',
            boxShadow: eased < 0.98 ? `inset -4px 0 12px rgba(0,0,0,0.15)` : 'none',
          }}
        >
          {/* Vertical groove line */}
          <div
            style={{
              position: 'absolute',
              left: '30%',
              top: '10%',
              width: 1,
              height: '80%',
              background: 'rgba(100,102,110,0.3)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '65%',
              top: '10%',
              width: 1,
              height: '80%',
              background: 'rgba(100,102,110,0.3)',
            }}
          />
        </div>,
      )
    }

    // Rubber seal lines at the split points
    const sealElements = []
    for (let s = 1; s < panelCount; s++) {
      sealElements.push(
        <div
          key={`seal-${s}`}
          style={{
            position: 'absolute',
            top: 0,
            left: s * panelWidth - 1,
            width: 2,
            height,
            background: 'rgba(30,32,40,0.6)',
            opacity: 1 - slideProgress * 0.9,
          }}
        />,
      )
    }

    const textOpacity =
      phase === 'enter'
        ? Math.min(1, enterProgress * 2.5)
        : phase === 'hold'
          ? 1
          : 1 - exitProgress

    return (
      <>
        {/* Text behind the panels */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>
        {/* Sliding door panels */}
        {panelElements}
        {sealElements}
        {/* Top and bottom track rails */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 4,
            background: 'rgba(100,102,110,0.35)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 4,
            background: 'rgba(100,102,110,0.35)',
          }}
        />
      </>
    )
  },
}

function SlidingDoorsComponent(props: MotionGraphicProps<SlidingDoorsConfig>) {
  ;(globalThis as any).__slidingDoorsConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sliding-doors',
  title: 'Kinetic Sliding Doors',
  description: 'Sliding door panels part left and right to reveal text, with staggered inner-to-outer motion and metallic sheen',
  tags: ['kinetic', 'typography', 'sliding', 'doors', 'reveal', 'geometric', 'mechanical', 'panels'],
  category: 'captions',
  component: SlidingDoorsComponent as any,
  defaultConfig: {
    words: ['SLIDE', 'OPEN', 'PART', 'GLIDE'],
    colors: ['#F8FAFC', '#E2E8F0', '#DBEAFE', '#E0F2FE'],
    bgColor: '#0c1225',
    cycleDuration: 1.5,
    panelCount: 4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SLIDE', 'OPEN', 'PART', 'GLIDE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F8FAFC', '#E2E8F0', '#DBEAFE', '#E0F2FE'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1225', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.4,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'panelCount',
      label: 'Panel Count',
      type: 'number',
      defaultValue: 4,
      min: 2,
      max: 6,
      group: 'Animation',
    },
  ],
})
