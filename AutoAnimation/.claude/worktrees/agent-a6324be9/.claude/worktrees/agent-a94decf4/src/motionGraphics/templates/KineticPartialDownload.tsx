import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PartialDownloadConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Ease-out cubic */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Download progress bar and speed meter
    const dlPct = Math.min(100, Math.floor(50 + time * 8 + Math.sin(time * 1.2) * 10) % 101)
    const speed = (0.8 + Math.sin(time * 0.9) * 0.4).toFixed(1)
    const eta = Math.max(0, Math.floor(12 - time * 2))
    const barWidth = (dlPct / 100) * (width - 30)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Download progress bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: 10,
            right: 10,
            height: 3,
            background: 'rgba(80, 160, 255, 0.08)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: barWidth,
              background: 'rgba(80, 160, 255, 0.22)',
              transition: 'width 0.1s linear',
            }}
          />
        </div>
        {/* Download stats */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(80, 160, 255, 0.12)',
            letterSpacing: 0.5,
          }}
        >
          {dlPct}% — {speed} MB/s — ETA {eta}s
        </div>
        {/* HTTP range request info */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(80, 160, 255, 0.09)',
          }}
        >
          GET /file.bin HTTP/1.1  Range: bytes=0-
        </div>
        {/* Incomplete content indicator */}
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(255, 120, 50, 0.09)',
          }}
        >
          206 Partial Content
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 191 + 37

    // The core visual: top half of text is always visible (already downloaded),
    // bottom half loads in progressively using a clip reveal

    if (phase === 'enter') {
      // Top half: immediately visible, crisp
      // Bottom half: gradually reveals downward as download "arrives"
      const bottomReveal = easeOut(enterProgress)
      // The clip reveal: from 0% (top half only) to 100% (full text)
      // We split text into top (0-50%) and bottom (50-100%) via clipPath
      const clipHeightPct = 50 + bottomReveal * 50

      // Additional: the bottom half also starts blurry and sharpens
      const bottomBlur = Math.max(0, (1 - bottomReveal) * 4)

      // Download position indicator line
      const dlLineY = 50 + bottomReveal * 50 // percentage

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Top half — always clear */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(42px, 13vw, 170px)',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              color,
              clipPath: 'inset(0 0 50% 0)',
            }}
          >
            {word}
          </div>
          {/* Bottom half — loads in with blur clearing */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(42px, 13vw, 170px)',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              color,
              clipPath: `inset(50% 0 ${100 - clipHeightPct}% 0)`,
              filter: bottomBlur > 0 ? `blur(${bottomBlur}px)` : undefined,
              opacity: 0.3 + bottomReveal * 0.7,
            }}
          >
            {word}
          </div>
          {/* Download progress line */}
          {bottomReveal < 0.98 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, calc(-50% + ${dlLineY - 50}%))`,
                width: '80%',
                height: 1,
                background: `${color}40`,
                boxShadow: `0 0 4px ${color}60`,
              }}
            />
          )}
          {/* Percent display */}
          <div
            style={{
              position: 'absolute',
              bottom: '30%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: `${color}50`,
              whiteSpace: 'nowrap',
            }}
          >
            {Math.floor(bottomReveal * 100)}%
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Fully downloaded — sharp complete text
      // Brief "re-download" flicker at 60% hold
      const redownload = holdProgress > 0.6 && holdProgress < 0.65
      const reClip = redownload
        ? `inset(${50 + (holdProgress - 0.6) * 200}% 0 0 0)`
        : 'none'

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(42px, 13vw, 170px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            color,
            textShadow: `0 0 8px ${color}30`,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: download reversed — bottom half disappears first, then top
      const reverseReveal = exitProgress
      const clipHeightPct = Math.max(0, 100 - reverseReveal * 150)
      const opacity = Math.max(0, 1 - exitProgress * 1.2)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(42px, 13vw, 170px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            color,
            clipPath: `inset(0 0 ${100 - clipHeightPct}% 0)`,
            opacity,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function PartialDownloadComponent(props: MotionGraphicProps<PartialDownloadConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-partial-download',
  title: 'Kinetic Partial Download',
  description:
    'Half-downloaded file: top half of text is visible immediately, bottom half loads in with progressive clarity as download completes. HTTP 206 Partial Content effect.',
  tags: ['kinetic', 'typography', 'glitch', 'download', 'partial', 'loading', 'http', 'digital'],
  category: 'captions',
  component: PartialDownloadComponent as any,
  defaultConfig: {
    words: ['DOWNLOAD', 'PARTIAL', 'LOADING', 'COMPLETE'],
    colors: ['#5090FF', '#3070FF', '#70B0FF', '#2060FF'],
    bgColor: '#020408',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DOWNLOAD', 'PARTIAL', 'LOADING', 'COMPLETE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5090FF', '#3070FF', '#70B0FF', '#2060FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020408', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
