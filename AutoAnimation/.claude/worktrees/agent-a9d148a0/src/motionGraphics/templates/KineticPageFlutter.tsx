import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PageFlutterConfig extends KineticBaseConfig {}

// Deterministic floating page positions
const PAGES = Array.from({ length: 12 }).map((_, i) => ({
  x: ((i * 31 + 17) % 100),
  y: ((i * 47 + 23) % 100),
  rotation: ((i * 67) % 40) - 20,
  size: 12 + (i % 4) * 4,
  phase: i * 1.3,
  speed: 0.5 + (i % 3) * 0.3,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, #3d2b1f 0%, ${bgColor} 100%)`,
        }}
      >
        {/* Paper texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,109,76,0.03) 2px, rgba(139,109,76,0.03) 4px)',
          }}
        />
        {/* Floating page fragments */}
        {PAGES.map((page, i) => {
          const floatY = Math.sin(time * page.speed + page.phase) * 15
          const floatR = Math.sin(time * 0.8 + page.phase) * 10
          const drift = Math.sin(time * 0.3 + page.phase * 2) * 5
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${page.x}%`,
                top: `${page.y}%`,
                width: page.size,
                height: page.size * 1.4,
                background: 'rgba(245,235,220,0.08)',
                borderRadius: 1,
                transform: `translateY(${floatY}px) translateX(${drift}px) rotate(${page.rotation + floatR}deg)`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    holdProgress,
  }: WordRenderProps) => {
    let opacity = 0
    let rotateY = 0
    let translateY = 0
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      // Pages flutter open to reveal text
      const flipProgress = Math.min(1, enterProgress * 1.5)
      const eased = 1 - Math.pow(1 - flipProgress, 3)
      rotateY = (1 - eased) * 90
      opacity = Math.min(1, enterProgress * 2.5)
      translateY = (1 - eased) * 30
      scale = 0.85 + eased * 0.15
      blur = (1 - eased) * 3
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle page breathing
      const breath = Math.sin(holdProgress * Math.PI * 3) * 0.015
      scale = 1 + breath
      rotateY = Math.sin(holdProgress * Math.PI * 2) * 2
    } else {
      // Flutter away
      const eased = exitProgress * exitProgress
      rotateY = eased * -90
      opacity = 1 - eased
      translateY = eased * -40
      scale = 1 - eased * 0.2
      blur = eased * 4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) perspective(600px) rotateY(${rotateY}deg) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          transformOrigin: 'center center',
        }}
      >
        {/* Page shadow */}
        <div
          style={{
            position: 'absolute',
            inset: '-12% -8%',
            background: 'rgba(245,235,220,0.06)',
            borderRadius: 4,
            border: '1px solid rgba(139,109,76,0.12)',
            boxShadow: '2px 3px 12px rgba(0,0,0,0.2)',
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
            fontSize: 'clamp(38px, 11vw, 140px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color,
            textShadow: '2px 2px 8px rgba(60,40,20,0.3)',
            whiteSpace: 'nowrap',
            padding: '0.1em 0.2em',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PageFlutterComponent(props: MotionGraphicProps<PageFlutterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-page-flutter',
  title: 'Kinetic Page Flutter',
  description:
    'Text appears as book pages flutter open with 3D perspective rotation, floating page fragments drift in the background',
  tags: ['kinetic', 'typography', 'book', 'page', 'flutter', 'literary', 'reading', 'literature'],
  category: 'captions',
  component: PageFlutterComponent as any,
  defaultConfig: {
    words: ['ONCE', 'UPON', 'A', 'TIME'],
    colors: ['#C9A96E', '#D4B896', '#8B6D4C', '#A0845C'],
    bgColor: '#1a150e',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ONCE', 'UPON', 'A', 'TIME'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C9A96E', '#D4B896', '#8B6D4C', '#A0845C'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
