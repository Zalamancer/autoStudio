import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SciFiHudConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const bracketSize = Math.min(width, height) * 0.08
    const bracketThickness = 2
    const bracketColor = 'rgba(0, 255, 255, 0.3)'
    const margin = 20

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Top-left corner bracket */}
        <div style={{ position: 'absolute', top: margin, left: margin, width: bracketSize, height: bracketThickness, background: bracketColor }} />
        <div style={{ position: 'absolute', top: margin, left: margin, width: bracketThickness, height: bracketSize, background: bracketColor }} />
        {/* Top-right corner bracket */}
        <div style={{ position: 'absolute', top: margin, right: margin, width: bracketSize, height: bracketThickness, background: bracketColor }} />
        <div style={{ position: 'absolute', top: margin, right: margin, width: bracketThickness, height: bracketSize, background: bracketColor }} />
        {/* Bottom-left corner bracket */}
        <div style={{ position: 'absolute', bottom: margin, left: margin, width: bracketSize, height: bracketThickness, background: bracketColor }} />
        <div style={{ position: 'absolute', bottom: margin, left: margin, width: bracketThickness, height: bracketSize, background: bracketColor }} />
        {/* Bottom-right corner bracket */}
        <div style={{ position: 'absolute', bottom: margin, right: margin, width: bracketSize, height: bracketThickness, background: bracketColor }} />
        <div style={{ position: 'absolute', bottom: margin, right: margin, width: bracketThickness, height: bracketSize, background: bracketColor }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let clipInset = '0 100% 0 0' // clips from right

    if (phase === 'enter') {
      // Scan line reveal: word appears progressively from left to right
      opacity = 1
      const revealPercent = 100 - enterProgress * 100
      clipInset = `0 ${revealPercent}% 0 0`
    } else if (phase === 'hold') {
      opacity = 1
      clipInset = '0 0% 0 0'
    } else {
      // Data corruption: scramble out with opacity
      opacity = 1 - exitProgress
      clipInset = '0 0% 0 0'
    }

    // Slight scan glitch during hold
    const glitchOffset = phase === 'hold'
      ? Math.sin(Date.now() * 0.01 + index) * 0.5
      : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${glitchOffset}px)`,
          opacity,
          clipPath: `inset(${clipInset})`,
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 6,
          color,
          textShadow: `0 0 8px ${color}, 0 0 20px ${color}40`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function SciFiHudComponent(props: MotionGraphicProps<SciFiHudConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sci-fi-hud',
  title: 'Kinetic Sci-Fi HUD',
  description: 'Sci-fi heads-up display with corner brackets, scan line reveal, and cyan glow',
  tags: ['kinetic', 'typography', 'sci-fi', 'hud', 'futuristic', 'cyber'],
  category: 'captions',
  component: SciFiHudComponent as any,
  defaultConfig: {
    words: ['TARGET', 'LOCKED', 'ENGAGE', 'FIRE'],
    colors: ['#00FFFF', '#00FF88', '#FFFF00', '#FF6600'],
    bgColor: '#0a0f1a',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TARGET', 'LOCKED', 'ENGAGE', 'FIRE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#00FF88', '#FFFF00', '#FF6600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0f1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
