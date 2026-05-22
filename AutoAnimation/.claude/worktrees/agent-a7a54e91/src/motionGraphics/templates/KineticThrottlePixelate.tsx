import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ThrottlePixelateConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Bandwidth throttle pixelation: ISP throttles connection → video degrades to low res
// Text starts crisp, degrades to pixel-art quality, then recovers when throttle lifts
// Like changing Netflix from 4K → 480p in real time

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Bandwidth throttle graph
    const numPoints = 40
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Speed graph */}
        {Array.from({ length: numPoints }, (_, i) => {
          const t = time - (numPoints - i) * 0.05
          const throttled = Math.sin(t * 0.5) > 0.2
          const speed = throttled ? 0.1 + rand(i * 13 + Math.floor(t * 4)) * 0.3 : 0.7 + rand(i * 7) * 0.3
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(i / numPoints) * 100}%`,
                bottom: 6,
                width: `${100 / numPoints}%`,
                height: `${speed * 18}px`,
                background: throttled ? 'rgba(255,80,80,0.3)' : 'rgba(80,200,80,0.2)',
              }}
            />
          )
        })}
        {/* Resolution badge */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255,80,80,0.35)',
            letterSpacing: 1,
            fontWeight: 700,
          }}
        >
          {['4K', '1080p', '720p', '480p', '240p', '144p'][Math.floor(Math.abs(Math.sin(time * 0.4)) * 6)]}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 22,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(255,80,80,0.2)',
          }}
        >
          ISP THROTTLE ACTIVE
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Pixelation amount based on throttle state
    // Lower = more pixelated (more throttled)
    const getPixelSize = (throttleLevel: number) => {
      // 0 = max throttle (huge pixels), 1 = no throttle (crisp)
      if (throttleLevel > 0.9) return 1
      if (throttleLevel > 0.7) return 2
      if (throttleLevel > 0.5) return 4
      if (throttleLevel > 0.3) return 8
      return 16
    }

    let throttleLevel = 1
    let opacity = 1

    if (phase === 'enter') {
      // Start throttled (pixelated), bandwidth opens up
      throttleLevel = enterProgress
      opacity = 0.3 + enterProgress * 0.7
    } else if (phase === 'hold') {
      // Throttle dips and recovers during hold
      const throttleDip = Math.max(0, Math.sin((holdProgress - 0.3) * Math.PI * 2) * 0.6)
      throttleLevel = 1 - throttleDip
    } else {
      throttleLevel = 1 - exitProgress
      opacity = 1 - exitProgress * 0.8
    }

    const pixelSize = getPixelSize(throttleLevel)
    const isPixelated = pixelSize > 1

    // Simulate pixelation with CSS filter (image-rendering: pixelated)
    // and by scaling up a small element
    const fontSize = isPixelated
      ? `clamp(${Math.floor(40 / pixelSize)}px, ${Math.floor(11 / pixelSize)}vw, ${Math.floor(160 / pixelSize)}px)`
      : 'clamp(40px, 11vw, 160px)'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: isPixelated ? `translate(-50%, -50%) scale(${pixelSize})` : 'translate(-50%, -50%)',
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize,
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: isPixelated ? 1 : 2,
          opacity,
          imageRendering: isPixelated ? 'pixelated' : 'auto',
          textShadow: isPixelated ? 'none' : `0 0 8px ${color}50`,
          // Pixelation shimmer on high throttle
          filter: throttleLevel < 0.3 ? 'blur(0.5px)' : 'none',
        }}
      >
        {word}
      </div>
    )
  },
}

function ThrottlePixelateComponent(props: MotionGraphicProps<ThrottlePixelateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-throttle-pixelate',
  title: 'Kinetic Throttle Pixelate',
  description:
    'ISP bandwidth throttle — text degrades from 4K crisp to 144p pixelated as connection is throttled, with live resolution badge and speed graph',
  tags: ['kinetic', 'typography', 'network', 'throttle', 'pixelate', 'bandwidth', 'isp', 'stream', 'digital'],
  category: 'captions',
  component: ThrottlePixelateComponent as any,
  defaultConfig: {
    words: ['THROTTLE', 'DEGRADE', 'PIXELATE', 'RECOVER'],
    colors: ['#FF6600', '#FF8800', '#FF5500', '#FFAA44'],
    bgColor: '#090400',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['THROTTLE', 'DEGRADE', 'PIXELATE', 'RECOVER'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6600', '#FF8800', '#FF5500', '#FFAA44'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#090400', group: 'Style' },
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
