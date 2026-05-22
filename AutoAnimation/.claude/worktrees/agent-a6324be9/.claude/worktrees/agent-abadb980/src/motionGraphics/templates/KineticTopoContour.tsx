import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TopoContourConfig extends KineticBaseConfig {
  contourLevels: number
  lineSpacing: number
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Map-style border tick marks */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
      {/* Compass rose hint */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 14,
          opacity: 0.2,
          fontFamily: 'monospace',
          fontSize: 10,
          color: '#8BC4A8',
          lineHeight: 1.2,
          textAlign: 'center',
        }}
      >
        N<br />↑
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const levels = 16
    let buildP = 0
    let retreatP = 0

    if (phase === 'enter') {
      buildP = easeOutQuart(enterProgress)
    } else if (phase === 'hold') {
      buildP = 1
    } else {
      buildP = 1
      retreatP = easeInCubic(exitProgress)
    }

    // Contour lines build from outside inward (like reading elevation)
    // Each level is an ellipse that scales up as it's revealed
    const contourLines = []
    for (let l = 0; l < levels; l++) {
      // Outer levels appear first (low elevation), inner last (high elevation)
      const levelFraction = l / (levels - 1)
      const levelDelay = levelFraction * 0.5 // outer appear first
      const levelP = Math.max(0, Math.min(1, (buildP - levelDelay) / (1 - levelDelay + 0.01)))
      const easedLevel = easeOutQuart(levelP)

      // Size: outer levels are larger
      const baseW = width * (0.9 - levelFraction * 0.65)
      const baseH = height * (0.85 - levelFraction * 0.65)

      // Slight waviness for organic topo feel
      const wave = Math.sin(l * 0.8 + index * 0.3) * 6

      const elevation = Math.floor((levelFraction * 100) / 10) * 100 // 100m intervals

      const isMajor = l % 4 === 0
      const strokeOpacity = (isMajor ? 0.55 : 0.25) * easedLevel * (1 - retreatP)

      // Color gradient: greens (low) to browns (high) to white (peak)
      const hue = 140 - levelFraction * 80
      const sat = 40 - levelFraction * 15
      const light = 35 + levelFraction * 40
      const contourColor = `hsl(${hue},${sat}%,${light}%)`

      contourLines.push(
        <ellipse
          key={l}
          cx={width / 2 + wave * (1 - levelFraction)}
          cy={height / 2}
          rx={(baseW / 2) * easedLevel}
          ry={(baseH / 2) * easedLevel}
          fill="none"
          stroke={contourColor}
          strokeWidth={isMajor ? 1.5 : 0.8}
          strokeOpacity={strokeOpacity}
          strokeDasharray={isMajor ? undefined : undefined}
        />,
      )

      // Elevation labels on major lines
      if (isMajor && easedLevel > 0.6 && l > 0 && l < levels - 1) {
        contourLines.push(
          <text
            key={`lbl${l}`}
            x={width / 2 + (baseW / 2) * easedLevel + 4}
            y={height / 2 + 4}
            fill={contourColor}
            fontSize={8}
            fontFamily="monospace"
            opacity={strokeOpacity * 0.8}
          >
            {elevation}
          </text>,
        )
      }
    }

    // Text emerges as the summit — revealed last, at the center peak
    const textOpacity = phase === 'enter' ? Math.max(0, (buildP - 0.65) / 0.35) : phase === 'hold' ? 1 : 1 - retreatP

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          {contourLines}
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, textOpacity),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(48px, 12vw, 150px)',
              fontWeight: 700,
              color,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textShadow: `0 2px 12px rgba(0,0,0,0.6)`,
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function TopoContourComponent(props: MotionGraphicProps<TopoContourConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-topo-contour',
  title: 'Kinetic Topo Contour',
  description:
    'Topographic contour lines build outward from the center like reading elevation rings on a map, revealing the text at the summit.',
  tags: [
    'kinetic',
    'typography',
    'topographic',
    'contour',
    'map',
    'elevation',
    'lines',
    'construction',
    'nature',
    'build',
  ],
  category: 'captions',
  component: TopoContourComponent as any,
  defaultConfig: {
    words: ['PEAK', 'SUMMIT', 'RISE', 'CLIMB'],
    colors: ['#F5F0E8', '#FFFFFF', '#E8E0D0', '#D4C9B8'],
    bgColor: '#1A1E16',
    cycleDuration: 2.2,
    contourLevels: 16,
    lineSpacing: 12,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PEAK', 'SUMMIT', 'RISE', 'CLIMB'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F5F0E8', '#FFFFFF', '#E8E0D0', '#D4C9B8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1E16', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'contourLevels',
      label: 'Contour Levels',
      type: 'number',
      defaultValue: 16,
      min: 6,
      max: 30,
      group: 'Animation',
    },
    {
      key: 'lineSpacing',
      label: 'Line Spacing (px)',
      type: 'number',
      defaultValue: 12,
      min: 6,
      max: 30,
      group: 'Animation',
    },
  ],
})
