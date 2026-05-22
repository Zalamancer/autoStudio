import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScanlineWipeConfig extends KineticBaseConfig {
  scanlineSpacing: number
}

/* ---------- Easing ---------- */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInCubic(t: number): number {
  return t * t * t
}
// Sharp deceleration — scanline hits a stop
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

/* ---------- Deterministic pseudo-random ---------- */
function seededRand(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Moving scanlines — a slow horizontal refresh pattern, NOT a monitor bezel
    const lineSpacing = 4
    const lineCount = Math.ceil(height / lineSpacing)
    const scrollOffset = (time * 12) % lineSpacing

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Scanline texture — purely atmospheric, no screen borders */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent ${lineSpacing - 1}px,
              rgba(255, 255, 255, 0.022) ${lineSpacing - 1}px,
              rgba(255, 255, 255, 0.022) ${lineSpacing}px
            )`,
            backgroundPosition: `0 ${scrollOffset}px`,
            pointerEvents: 'none',
          }}
        />
        {/* Vignette — draws focus to center, not to edges as a frame */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)',
            pointerEvents: 'none',
          }}
        />
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
    fps,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.62), 140)

    const time = frame / fps

    // The scanline: a bright horizontal bar that sweeps top→bottom to reveal text
    // Entry: bar sweeps downward, text is revealed below it
    // Exit: bar sweeps upward, erasing text above it

    let scanY = -5        // scanline Y position as % of height
    let textOpacity = 1
    let brightness = 1

    if (phase === 'enter') {
      // Scanline sweeps from -5% to 105% over enterProgress
      scanY = easeOutQuint(enterProgress) * 110 - 5
    } else if (phase === 'hold') {
      scanY = 110 // off screen bottom
      // Subtle hold pulse — slow brightness oscillation like phosphor glow
      brightness = 0.92 + Math.sin(holdProgress * Math.PI * 3) * 0.08
    } else {
      // Exit: scanline sweeps back up, erasing as it goes
      scanY = 110 - easeInCubic(exitProgress) * 115
      textOpacity = 1 - easeInCubic(Math.max(0, exitProgress - 0.6) / 0.4)
    }

    const scanlineHeightPx = 3
    const scanlineYPx = (scanY / 100) * height

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Text — revealed/erased by clip-path keyed to scanline position */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            // During enter: only show text BELOW the scanline
            // During exit: only show text ABOVE the scanline
            clipPath: phase === 'enter'
              ? `polygon(0 ${Math.min(scanY + 2, 100)}%, 100% ${Math.min(scanY + 2, 100)}%, 100% 100%, 0 100%)`
              : phase === 'exit'
                ? `polygon(0 0, 100% 0, 100% ${Math.max(scanY - 2, 0)}%, 0 ${Math.max(scanY - 2, 0)}%)`
                : undefined,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              gap: 2,
              opacity: textOpacity,
              filter: `brightness(${brightness})`,
            }}
          >
            {chars.map((char, ci) => {
              // Hold: per-char gentle lateral drift — signal breathing
              let charTranslateX = 0
              if (phase === 'hold') {
                charTranslateX = Math.sin(holdProgress * Math.PI * 2 + ci * 0.6) * 0.8
              }
              return (
                <span
                  key={ci}
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                    fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                    fontWeight: 700,
                    color,
                    letterSpacing: '0.06em',
                    transform: `translateX(${charTranslateX}px)`,
                    textShadow: `0 0 30px ${color}50, 0 0 8px ${color}30`,
                  }}
                >
                  {char}
                </span>
              )
            })}
          </div>
        </div>

        {/* The scanline bar itself — bright leading edge */}
        {(phase === 'enter' || phase === 'exit') && scanY > -8 && scanY < 108 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: scanlineYPx - scanlineHeightPx,
              height: scanlineHeightPx + 2,
              background: `linear-gradient(180deg,
                transparent,
                ${color}CC 40%,
                ${color}FF 60%,
                ${color}CC 80%,
                transparent
              )`,
              boxShadow: `0 0 12px 3px ${color}60, 0 0 40px 8px ${color}20`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Trailing glow below scanline during enter — phosphor afterglow */}
        {phase === 'enter' && scanY > 5 && scanY < 110 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: scanlineYPx,
              height: Math.min(scanlineYPx, 60),
              background: `linear-gradient(180deg, ${color}08, transparent)`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function ScanlineWipeComponent(props: MotionGraphicProps<ScanlineWipeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-scanline-wipe',
  title: 'Scanline Wipe',
  description:
    'A glowing horizontal bar sweeps downward to reveal text beneath it — like a refresh signal reading new data. Hold phase: slow phosphor-glow pulse. Exit: bar sweeps back up erasing the text. The digital aesthetic adds drama without being tech-specific — works for reveals, subtitles, and highlight words across any content type.',
  tags: [
    'kinetic',
    'typography',
    'scanline',
    'wipe',
    'reveal',
    'digital',
    'refresh',
    'dramatic',
    'glow',
    'tech',
    'versatile',
  ],
  category: 'captions',
  component: ScanlineWipeComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'THIS', 'JUST', 'IN'],
    colors: ['#00FF88', '#00E0FF', '#FFFFFF', '#00FF88'],
    bgColor: '#060A0E',
    cycleDuration: 1.2,
    scanlineSpacing: 4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['REVEAL', 'THIS', 'JUST', 'IN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FF88', '#00E0FF', '#FFFFFF', '#00FF88'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060A0E', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'scanlineSpacing',
      label: 'Scanline Spacing (px)',
      type: 'number',
      defaultValue: 4,
      min: 2,
      max: 12,
      group: 'Style',
    },
  ],
})
