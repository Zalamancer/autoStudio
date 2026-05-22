import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PixelBuildConfig extends KineticBaseConfig {
  levels: number
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__pixelBuildConfig ?? { levels: 5 }
    const levels = Math.max(2, Math.min(8, config.levels ?? 5))

    // Resolution levels: level 0 = very coarse pixels, level (levels-1) = finest
    // During enter: progress from level 0 to levels-1 (coarse to fine)
    // During exit: progress from levels-1 to 0 (fine to coarse then disappear)
    const revealP =
      phase === 'hold' ? 1 : phase === 'enter' ? easeInOutQuad(enterProgress) : 1 - easeInOutQuad(exitProgress)

    // Which resolution level are we at?
    const levelIndex = revealP * (levels - 1)
    const currentLevel = Math.floor(levelIndex)
    const levelFrac = levelIndex - currentLevel

    // Pixel size at each level (exponential: coarsest = 2^(levels-1) * baseSize)
    const baseSize = 3 // finest pixel in px
    const pixelSize = baseSize * Math.pow(2, levels - 1 - currentLevel)
    const nextPixelSize = currentLevel < levels - 1 ? baseSize * Math.pow(2, levels - 2 - currentLevel) : baseSize

    // We render a pixelated mosaic grid covering the entire canvas.
    // Each "macro pixel" is one solid-color rectangle.
    // The color is derived from a simple pattern that approximates text presence.
    const cols = Math.ceil(width / pixelSize)
    const rows = Math.ceil(height / pixelSize)

    const pixels: React.ReactNode[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = c * pixelSize
        const py = r * pixelSize
        const pw = Math.min(pixelSize, width - px)
        const ph = Math.min(pixelSize, height - py)

        // Determine if this pixel is "text-colored" or "bg-colored"
        // Use a deterministic pattern based on grid position and level
        // Simulate text area: center horizontal band + character-like pattern
        const normX = (c + 0.5) / cols
        const normY = (r + 0.5) / rows

        // Text occupies roughly the center 60% vertically and 80% horizontally
        const inTextV = normY > 0.25 && normY < 0.75
        const inTextH = normX > 0.1 && normX < 0.9

        // At coarse levels, use block color; at fine levels, transition to transparent
        // (text will show through the actual text element below)
        const isText =
          inTextV &&
          inTextH &&
          // Create character-like density variation using deterministic noise
          (c * 7 + r * 13) % 11 < 6

        const opacity = isText ? 0.85 - levelFrac * 0.85 : 0.4 - levelFrac * 0.35
        if (opacity < 0.02) continue

        const pixelColor = isText ? color : 'rgba(20,20,30,0.8)'

        pixels.push(
          <div
            key={`pxb-${r}-${c}`}
            style={{
              position: 'absolute',
              left: px,
              top: py,
              width: pw,
              height: ph,
              background: pixelColor,
              opacity,
            }}
          />,
        )
      }
    }

    // Text fades in as resolution increases
    const textOpacity =
      phase === 'hold'
        ? 1
        : phase === 'enter'
          ? Math.max(0, (enterProgress - 0.5) / 0.5)
          : Math.max(0, 1 - exitProgress / 0.5)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Actual sharp text underneath */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>
        {/* Pixel mosaic overlay that fades as resolution refines */}
        {pixels}
      </div>
    )
  },
}

function PixelBuildComponent(props: MotionGraphicProps<PixelBuildConfig>) {
  ;(globalThis as any).__pixelBuildConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pixel-build',
  title: 'Kinetic Pixel Build',
  description:
    'Text builds from large coarse pixel blocks that progressively shrink toward full resolution, like a texture loading from low-res to hi-res',
  tags: ['kinetic', 'typography', 'pixel', 'build', 'reveal', 'geometric', 'pattern', 'resolution', 'mosaic'],
  category: 'captions',
  component: PixelBuildComponent as any,
  defaultConfig: {
    words: ['PIXEL', 'BUILD', 'RENDER', 'HD'],
    colors: ['#39FF14', '#FF6B6B', '#00DDFF', '#FFD700'],
    bgColor: '#0A0A0A',
    cycleDuration: 1.5,
    levels: 5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PIXEL', 'BUILD', 'RENDER', 'HD'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#39FF14', '#FF6B6B', '#00DDFF', '#FFD700'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'levels', label: 'Resolution Levels', type: 'number', defaultValue: 5, min: 2, max: 8, group: 'Animation' },
  ],
})
