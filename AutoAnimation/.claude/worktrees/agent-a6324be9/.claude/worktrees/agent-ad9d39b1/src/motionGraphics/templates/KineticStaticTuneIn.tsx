import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StaticTuneInConfig extends KineticBaseConfig {
  noiseColor: string
}

/* ---------- Easing for signal / static mechanics ---------- */

// Aggressive power-on surge
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Slow creeping dread
function easeInQuad(t: number): number {
  return t * t
}

// Signal-lock snap
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/* ---------- Deterministic pseudo-random ---------- */
function seededRand(seed: number): number {
  return (Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

/* ---------- Generate static noise band positions ---------- */
function noiseLines(
  width: number,
  height: number,
  count: number,
  frameSeed: number,
): Array<{ y: number; h: number; opacity: number; xShift: number }> {
  return Array.from({ length: count }, (_, i) => ({
    y: Math.abs(seededRand(i * 31 + frameSeed * 0.1)) * height,
    h: 1 + Math.abs(seededRand(i * 17 + frameSeed * 0.13 + 7)) * 4,
    opacity: 0.04 + Math.abs(seededRand(i * 53 + frameSeed * 0.07 + 11)) * 0.12,
    xShift: (seededRand(i * 71 + frameSeed * 0.09 + 3) * 2 - 1) * width * 0.08,
  }))
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Static noise bands — new positions every ~3 frames
    const frameSeed = Math.floor(frame / 3)
    const bands = noiseLines(width, height, 22, frameSeed)

    // Slow horizontal scan bar — broadcasting signal
    const broadcastScan = ((time * 60) % (height + 80)) - 40

    // Interference flicker — rapid on/off
    const interference = Math.sin(time * 47.3) > 0.7

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Base noise texture — fine grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(255, 255, 255, 0.008) 2px,
                rgba(255, 255, 255, 0.008) 3px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(255, 255, 255, 0.005) 2px,
                rgba(255, 255, 255, 0.005) 3px
              )
            `,
          }}
        />

        {/* RGB channel separation — analog interference */}
        {interference && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 0, 0, 0.012)',
              transform: 'translateX(2px)',
              mixBlendMode: 'screen',
            }}
          />
        )}

        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {/* Static noise bands */}
          {bands.map((band, i) => (
            <rect
              key={`band-${i}`}
              x={band.xShift}
              y={band.y}
              width={width - Math.abs(band.xShift)}
              height={band.h}
              fill={`rgba(200, 200, 200, ${band.opacity})`}
            />
          ))}

          {/* Broadcast scan line */}
          <rect
            x={0}
            y={broadcastScan}
            width={width}
            height={2}
            fill="rgba(255, 255, 255, 0.018)"
          />

          {/* Transmission lines — horizontal teletype bars */}
          {Array.from({ length: 3 }, (_, i) => (
            <line
              key={`tx-${i}`}
              x1={0}
              y1={height * (0.25 + i * 0.25)}
              x2={width}
              y2={height * (0.25 + i * 0.25)}
              stroke="rgba(255, 255, 255, 0.025)"
              strokeWidth={0.5}
            />
          ))}

          {/* "NO SIGNAL" label — faint, only in background */}
          <text
            x={width / 2}
            y={height * 0.85}
            textAnchor="middle"
            fill="rgba(200, 200, 200, 0.1)"
            fontSize={9}
            fontFamily="'Courier New', monospace"
            fontWeight={700}
            letterSpacing={6}
          >
            NO SIGNAL
          </text>

          {/* Channel number indicator */}
          <text
            x={16}
            y={height - 12}
            fill="rgba(200, 200, 200, 0.12)"
            fontSize={8}
            fontFamily="'Courier New', monospace"
            letterSpacing={2}
          >
            CH 04
          </text>

          {/* Transmission frequency */}
          <text
            x={width - 16}
            y={height - 12}
            textAnchor="end"
            fill="rgba(200, 200, 200, 0.12)"
            fontSize={8}
            fontFamily="'Courier New', monospace"
            letterSpacing={2}
          >
            {(107.3 + Math.sin(time * 0.4) * 0.1).toFixed(1)} MHz
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.66), 155)

    // clip-path reveal: static clears from a vertical center band outward
    // At t=0: clip is a narrow vertical slice in the center (text hidden in static)
    // At t=1: clip is full width (text fully visible)

    let clipHalfW = 0   // how many px each side of center is revealed
    let staticOverlayOpacity = 0
    let textOpacity = 0
    let textBlur = 0
    let chromaShift = 0

    if (phase === 'enter') {
      const t = easeOutExpo(enterProgress)
      clipHalfW = t * (width * 0.6)
      // Static noise over text — clears as signal locks
      staticOverlayOpacity = Math.max(0, 1 - enterProgress * 2.2)
      textOpacity = easeOutQuart(Math.min(1, enterProgress * 1.8))
      textBlur = Math.max(0, (1 - enterProgress * 2) * 6)
      // RGB chromatic aberration — signal finding its footing
      chromaShift = Math.max(0, (1 - enterProgress * 3) * 5)
    } else if (phase === 'hold') {
      clipHalfW = width * 0.6
      textOpacity = 1
      // Subtle static flicker — signal not perfectly stable
      staticOverlayOpacity = Math.max(0, Math.sin(holdProgress * Math.PI * 18) * 0.04)
      textBlur = 0
      chromaShift = Math.max(0, Math.sin(holdProgress * Math.PI * 9) * 0.8)
    } else {
      // Exit: signal loses lock — static reclaims the screen from outside in
      const t = easeInQuad(exitProgress)
      clipHalfW = (1 - t) * width * 0.6
      textOpacity = Math.max(0, 1 - exitProgress * 2.5)
      staticOverlayOpacity = t * 0.6
      textBlur = t * 4
      chromaShift = t * 6
    }

    // clip-path: reveal from center outward — inset(0 X% 0 X%) where X = (1 - ratio) * 50
    const cx = width / 2
    const revealLeft = Math.max(0, cx - clipHalfW)
    const revealRight = Math.min(width, cx + clipHalfW)
    const clipLeft = (revealLeft / width) * 100
    const clipRight = 100 - (revealRight / width) * 100
    const clipStyle =
      clipHalfW > 0
        ? `inset(0 ${clipRight.toFixed(1)}% 0 ${clipLeft.toFixed(1)}%)`
        : 'inset(0 50% 0 50%)'

    // Static overlay rectangles — deterministic per frame bucket
    const frameSeed = Math.floor((frame ?? 0) / 2)
    const overlayBands = staticOverlayOpacity > 0.005
      ? noiseLines(width, fontSize * 1.4, 12, frameSeed + 100)
      : []

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Main word — revealed by clip-path from center outward */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            clipPath: clipStyle,
            opacity: textOpacity,
            filter: textBlur > 0.1 ? `blur(${textBlur}px)` : undefined,
          }}
        >
          <span
            style={{
              fontFamily: "'Helvetica Neue', 'Arial Black', sans-serif",
              fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
              fontWeight: 900,
              color,
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              textShadow: `0 0 30px ${color}50, 0 0 60px ${color}20`,
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        </div>

        {/* Red channel ghost — chromatic aberration */}
        {chromaShift > 0.2 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${chromaShift}px), -50%)`,
              opacity: textOpacity * 0.35,
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          >
            <span
              style={{
                fontFamily: "'Helvetica Neue', 'Arial Black', sans-serif",
                fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                fontWeight: 900,
                color: '#FF3030',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              {word}
            </span>
          </div>
        )}

        {/* Blue channel ghost */}
        {chromaShift > 0.2 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% - ${chromaShift}px), -50%)`,
              opacity: textOpacity * 0.25,
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          >
            <span
              style={{
                fontFamily: "'Helvetica Neue', 'Arial Black', sans-serif",
                fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                fontWeight: 900,
                color: '#3030FF',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              {word}
            </span>
          </div>
        )}

        {/* Static overlay bands on top of text */}
        {overlayBands.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: width,
              height: fontSize * 1.4,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            <svg
              width={width}
              height={fontSize * 1.4}
              style={{ position: 'absolute', inset: 0 }}
            >
              {overlayBands.map((band, i) => (
                <rect
                  key={`ob-${i}`}
                  x={band.xShift}
                  y={band.y}
                  width={width}
                  height={band.h}
                  fill={`rgba(255, 255, 255, ${band.opacity * staticOverlayOpacity * 2})`}
                />
              ))}
            </svg>
          </div>
        )}

        {/* "TUNING..." label during enter */}
        {phase === 'enter' && staticOverlayOpacity > 0.1 && (
          <div
            style={{
              position: 'absolute',
              bottom: height * 0.14,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: 'rgba(200, 200, 200, 0.5)',
              letterSpacing: 6,
              opacity: staticOverlayOpacity * 0.9,
              whiteSpace: 'nowrap',
            }}
          >
            TUNING...
          </div>
        )}
      </div>
    )
  },
}

function StaticTuneInComponent(props: MotionGraphicProps<StaticTuneInConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-static-tune-in',
  title: 'Static Tune-In',
  description:
    'Analog TV static clears from the center outward as the signal locks — the word burns through the noise with chromatic RGB aberration and a TUNING... label. Hold phase keeps faint interference flicker. Exit loses the signal, static reclaims the frame.',
  tags: [
    'kinetic',
    'typography',
    'static',
    'noise',
    'television',
    'signal',
    'horror',
    'mystery',
    'thriller',
    'reveal',
    'tension',
    'cinematic',
    'glitch',
    'broadcast',
  ],
  category: 'captions',
  component: StaticTuneInComponent as any,
  defaultConfig: {
    words: ['INCOMING', 'BEWARE', 'THE TRUTH', 'STATIC'],
    colors: ['#F0F0E8', '#E8E8E0', '#FFFFFF', '#D8D8D0'],
    bgColor: '#080808',
    cycleDuration: 1.7,
    noiseColor: '#C8C8C8',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['INCOMING', 'BEWARE', 'THE TRUTH', 'STATIC'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F0F0E8', '#E8E8E0', '#FFFFFF', '#D8D8D0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.7,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    {
      key: 'noiseColor',
      label: 'Noise Color',
      type: 'color',
      defaultValue: '#C8C8C8',
      group: 'Style',
    },
  ],
})
