import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CMYKHalftoneConfig extends KineticBaseConfig {}

/* --- deterministic noise --- */
function hash(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* --- easing --- */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

/*
 * CMYK halftone screen angles (traditional offset printing angles):
 * C = 15deg, M = 75deg, Y = 0deg, K = 45deg
 */
const CMYK_CHANNELS = [
  { color: '#00FFFF', label: 'C', angle: 15 },
  { color: '#FF00FF', label: 'M', angle: 75 },
  { color: '#FFFF00', label: 'Y', angle: 0 },
  { color: '#000000', label: 'K', angle: 45 },
]

/*
 * Generate halftone dot grid as SVG background.
 * Each channel uses a rotated grid of circles whose radius
 * represents the "ink coverage" for that channel.
 */
function buildHalftoneSVG(
  color: string,
  angle: number,
  dotScale: number, // 0..1 controls dot radius
  width: number,
  height: number,
): string {
  const spacing = 8
  const maxRadius = spacing * 0.42
  const radius = maxRadius * Math.max(0, Math.min(1, dotScale))

  if (radius <= 0.1) return ''

  /* Build SVG with rotated dot pattern */
  const angleRad = (angle * Math.PI) / 180
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  /* We need to cover the canvas even when rotated, so extend grid */
  const diag = Math.sqrt(width * width + height * height)
  const cols = Math.ceil(diag / spacing) + 2
  const rows = Math.ceil(diag / spacing) + 2
  const capCells = Math.min(cols * rows, 1200)

  let circles = ''
  let count = 0
  for (let row = -rows / 2; row < rows / 2 && count < capCells; row++) {
    for (let col = -cols / 2; col < cols / 2 && count < capCells; col++) {
      const gx = col * spacing
      const gy = row * spacing
      /* rotate around center */
      const rx = gx * cos - gy * sin + width / 2
      const ry = gx * sin + gy * cos + height / 2
      /* only include dots within visible bounds (with margin) */
      if (rx > -spacing && rx < width + spacing && ry > -spacing && ry < height + spacing) {
        circles += `<circle cx="${rx.toFixed(1)}" cy="${ry.toFixed(1)}" r="${radius.toFixed(2)}" fill="${color}"/>`
        count++
      }
    }
  }

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${circles}</svg>`,
  )}`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    /* Paper texture grain */
    const grainCount = 45
    const grains = Array.from({ length: grainCount }, (_, i) => {
      const x = hash(i * 9.3) * 100
      const y = hash(i * 17.1 + 2) * 100
      const size = 1 + hash(i * 4.7) * 1.5
      const alpha = 0.025 + hash(i * 21.3) * 0.035
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(255,255,255,${alpha})`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    /* Halftone magnification indicator */
    const loupe = 0.05 + Math.sin(time * 2) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {grains}
        {/* Corner halftone screen angle labels */}
        {CMYK_CHANNELS.map((ch, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i % 2 === 0 ? 8 : undefined,
              right: i % 2 !== 0 ? 8 : undefined,
              top: i < 2 ? 8 : undefined,
              bottom: i >= 2 ? 8 : undefined,
              fontFamily: 'monospace',
              fontSize: 8,
              color: ch.color,
              opacity: loupe,
              pointerEvents: 'none',
            }}
          >
            {ch.label}: {ch.angle}deg
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {CMYK_CHANNELS.map((channel, ci) => {
          /*
           * Halftone dot scale:
           * Enter: dots grow from 0 to full size (staggered per channel)
           * Hold: dots breathe subtly
           * Exit: dots shrink to 0
           */
          let dotScale = 0
          let layerOpacity = 1

          if (phase === 'enter') {
            const stagger = ci * 0.12
            const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.8)))
            dotScale = easeOutExpo(p)
            layerOpacity = Math.min(1, p * 2.5)
          } else if (phase === 'hold') {
            /* Breathing: gentle scale oscillation */
            const breathe = 0.92 + Math.sin(holdProgress * 12 + ci * 1.6) * 0.08
            dotScale = breathe
            layerOpacity = 1
          } else {
            const stagger = (CMYK_CHANNELS.length - 1 - ci) * 0.12
            const p = Math.max(0, Math.min(1, (exitProgress - stagger) / (1 - stagger * 0.8)))
            dotScale = 1 - easeInExpo(p)
            layerOpacity = 1 - p * 0.3
          }

          /* Build halftone SVG for this channel */
          const svgUrl = buildHalftoneSVG(channel.color, channel.angle, dotScale, width, height)

          return (
            <div
              key={ci}
              style={{
                position: 'absolute',
                inset: 0,
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
                opacity: layerOpacity,
              }}
            >
              {/* Halftone dot layer as masked text */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    fontSize: 'clamp(44px, 13vw, 170px)',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    color: 'transparent',
                    display: 'flex',
                    /* Use the halftone SVG as background clipped to text */
                    backgroundImage: svgUrl ? `url("${svgUrl}")` : 'none',
                    backgroundSize: `${width}px ${height}px`,
                    backgroundPosition: 'center',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                  }}
                >
                  {chars.map((ch, charIdx) => {
                    /* Per-char stagger on enter/exit for extra depth */
                    let charScale = 1
                    if (phase === 'enter') {
                      const charDelay = charIdx * 0.06
                      const cp = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.6))
                      charScale = easeOutExpo(cp)
                    } else if (phase === 'exit') {
                      const charDelay = (chars.length - 1 - charIdx) * 0.06
                      const cp = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.6))
                      charScale = 1 - easeInExpo(cp)
                    }

                    return (
                      <span
                        key={charIdx}
                        style={{
                          display: 'inline-block',
                          transform: `scale(${charScale})`,
                          transformOrigin: 'center bottom',
                        }}
                      >
                        {ch === ' ' ? '\u00A0' : ch}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  },
}

function CMYKHalftoneComponent(props: MotionGraphicProps<CMYKHalftoneConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cmyk-halftone',
  title: 'Kinetic CMYK Halftone',
  description:
    'Print halftone simulation where each CMYK channel is rendered as a grid of dots at traditional screen angles (C=15deg, M=75deg, Y=0deg, K=45deg). Dots grow from zero to full size on enter, breathe during hold, and shrink on exit. Multiply blend creates authentic print color mixing.',
  tags: ['kinetic', 'typography', 'cmyk', 'print', 'halftone', 'dots', 'screen', 'retro-print'],
  category: 'captions',
  component: CMYKHalftoneComponent as any,
  defaultConfig: {
    words: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
    colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
