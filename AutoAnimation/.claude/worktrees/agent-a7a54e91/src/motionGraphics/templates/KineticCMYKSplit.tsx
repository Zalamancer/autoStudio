import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CMYKSplitConfig extends KineticBaseConfig {
  separation: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// CMYK color channels
const CMYK_LAYERS = [
  { color: '#00FFFF', label: 'C', offsetX: -1, offsetY: -0.5 },  // Cyan
  { color: '#FF00FF', label: 'M', offsetX: 1, offsetY: -0.5 },   // Magenta
  { color: '#FFFF00', label: 'Y', offsetX: -0.3, offsetY: 1 },   // Yellow
  { color: '#000000', label: 'K', offsetX: 0, offsetY: 0 },      // Key (Black)
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Registration mark hints */}
      <div style={{ position: 'absolute', top: 8, left: 8, opacity: 0.2 }}>
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="9" fill="none" stroke="white" strokeWidth="1" />
          <line x1="10" y1="1" x2="10" y2="19" stroke="white" strokeWidth="1" />
          <line x1="1" y1="10" x2="19" y2="10" stroke="white" strokeWidth="1" />
        </svg>
      </div>
      <div style={{ position: 'absolute', top: 8, right: 8, opacity: 0.2 }}>
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="9" fill="none" stroke="white" strokeWidth="1" />
          <line x1="10" y1="1" x2="10" y2="19" stroke="white" strokeWidth="1" />
          <line x1="1" y1="10" x2="19" y2="10" stroke="white" strokeWidth="1" />
        </svg>
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const maxSep = 22  // max pixel offset for separation

    let registerProgress = 0  // 0 = fully separated, 1 = registered/aligned
    let globalOpacity = 1

    if (phase === 'enter') {
      // Layers start separated, converge together
      // First the separation spreads wide (0-30%), then snaps to register (30-100%)
      if (enterProgress < 0.3) {
        registerProgress = 0
      } else {
        registerProgress = easeOutBack(Math.min(1, (enterProgress - 0.3) / 0.7))
      }
      globalOpacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      registerProgress = 1
      globalOpacity = 1
      // Subtle mis-registration vibration on hold
      const drift = Math.sin(holdProgress * Math.PI * 2) * 0.02
      registerProgress = 1 - Math.abs(drift)
    } else {
      // Exit: layers separate again
      registerProgress = 1 - easeInCubic(exitProgress)
      globalOpacity = 1 - exitProgress
    }

    const separation = maxSep * (1 - registerProgress)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap',
          opacity: globalOpacity,
        }}
      >
        {/* Render CMYK layers from bottom (K) to top */}
        {[...CMYK_LAYERS].reverse().map((layer, li) => {
          const realIndex = CMYK_LAYERS.length - 1 - li
          const isKeyLayer = realIndex === 3

          // Key layer drives final alignment — arrives last
          const layerDelay = realIndex * 0.08
          const layerSep = isKeyLayer ? 0 : separation

          const tx = layer.offsetX * layerSep
          const ty = layer.offsetY * layerSep

          // Layer-specific fade-in timing
          const layerP = isKeyLayer
            ? easeOutExpo(Math.min(1, Math.max(0, (enterProgress - 0.25) / 0.75)))
            : Math.min(1, enterProgress * 3)

          return (
            <div
              key={layer.label}
              style={{
                position: realIndex === 0 ? 'relative' : 'absolute',
                top: realIndex === 0 ? undefined : '50%',
                left: realIndex === 0 ? undefined : '50%',
                transform: realIndex === 0
                  ? `translate(${tx}px, ${ty}px)`
                  : `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
                mixBlendMode: isKeyLayer ? 'normal' : 'multiply',
                opacity: isKeyLayer ? (phase === 'enter' ? layerP : 1) : 0.85,
              }}
            >
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color: isKeyLayer ? color : layer.color,
                  display: 'block',
                  lineHeight: 1,
                  letterSpacing: 3,
                }}
              >
                {word}
              </span>
            </div>
          )
        })}

        {/* CMYK channel labels */}
        {phase === 'enter' && enterProgress < 0.7 && (
          <div
            style={{
              position: 'absolute',
              bottom: '-clamp(20px, 5vw, 60px)',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 8,
              opacity: Math.max(0, 0.7 - enterProgress),
            }}
          >
            {CMYK_LAYERS.map((l) => (
              <span
                key={l.label}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  color: l.color === '#000000' ? '#888' : l.color,
                  fontWeight: 700,
                }}
              >
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  },
}

function CMYKSplitComponent(props: MotionGraphicProps<CMYKSplitConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cmyk-split',
  title: 'Kinetic CMYK Split',
  description: 'CMYK printing channels start separated — cyan, magenta, yellow offset in different directions — then register/align together with a snap to reveal the full-color typography.',
  tags: ['kinetic', 'typography', 'cmyk', 'print', 'registration', 'layer', 'color', 'separation', 'offset', 'build'],
  category: 'captions',
  component: CMYKSplitComponent as any,
  defaultConfig: {
    words: ['PRINT', 'COLOR', 'INK', 'PRESS'],
    colors: ['#1A1A1A', '#222222', '#0D0D0D', '#333333'],
    bgColor: '#F8F4EE',
    cycleDuration: 1.8,
    separation: 22,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRINT', 'COLOR', 'INK', 'PRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#222222', '#0D0D0D', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F8F4EE', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'separation', label: 'Separation (px)', type: 'number', defaultValue: 22, min: 5, max: 60, group: 'Animation' },
  ],
})
