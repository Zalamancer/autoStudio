import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GhostFadeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, #111118 0%, ${bgColor} 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index }: WordRenderProps) => {
    // Ghost copies: 4 translucent duplicates at different offsets
    const ghostCount = 4
    const ghosts = Array.from({ length: ghostCount }, (_, i) => {
      const angle = (i / ghostCount) * Math.PI * 2
      const baseRadius = 15

      let offsetX = 0
      let offsetY = 0
      let ghostOpacity = 0

      if (phase === 'enter') {
        // Ghost copies start spread out and converge
        const spreadFactor = 1 - enterProgress
        offsetX = Math.cos(angle) * baseRadius * 3 * spreadFactor
        offsetY = Math.sin(angle) * baseRadius * 3 * spreadFactor
        ghostOpacity = enterProgress * 0.15
      } else if (phase === 'hold') {
        // Ethereal drifting: subtle circular movement
        const driftAngle = angle + holdProgress * Math.PI * 2
        const driftRadius = 3 + Math.sin(holdProgress * Math.PI * 4 + i) * 2
        offsetX = Math.cos(driftAngle) * driftRadius
        offsetY = Math.sin(driftAngle) * driftRadius
        ghostOpacity = 0.1 + Math.sin(holdProgress * Math.PI * 3 + i * 1.5) * 0.05
      } else {
        // Ghosts drift apart on exit
        offsetX = Math.cos(angle) * baseRadius * exitProgress * 2
        offsetY = Math.sin(angle) * baseRadius * exitProgress * 2
        ghostOpacity = 0.15 * (1 - exitProgress)
      }

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
            opacity: ghostOpacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            filter: 'blur(2px)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    })

    // Main text: very low opacity, pulsing
    let mainOpacity = 0
    let mainBlur = 0

    if (phase === 'enter') {
      mainOpacity = enterProgress * 0.5
      mainBlur = (1 - enterProgress) * 4
    } else if (phase === 'hold') {
      // Ghostly pulse
      mainOpacity = 0.4 + Math.sin(holdProgress * Math.PI * 4) * 0.15
    } else {
      mainOpacity = 0.5 * (1 - exitProgress)
      mainBlur = exitProgress * 6
    }

    return (
      <>
        {ghosts}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: mainOpacity,
            filter: mainBlur > 0 ? `blur(${mainBlur}px)` : undefined,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            textShadow: `0 0 20px ${color}, 0 0 40px rgba(200, 200, 255, 0.2)`,
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function GhostFadeComponent(props: MotionGraphicProps<GhostFadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ghost-fade',
  title: 'Kinetic Ghost Fade',
  description: 'Ghostly translucent text with multiple ethereal copies that drift and pulse, supernatural eerie vibe',
  tags: ['kinetic', 'typography', 'horror', 'ghost', 'ethereal', 'supernatural', 'dark', 'eerie'],
  category: 'captions',
  component: GhostFadeComponent as any,
  defaultConfig: {
    words: ['GHOST', 'HAUNT', 'SPIRIT', 'FADE'],
    colors: ['#8888CC', '#AAAADD', '#9999BB', '#7777AA'],
    bgColor: '#060610',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GHOST', 'HAUNT', 'SPIRIT', 'FADE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8888CC', '#AAAADD', '#9999BB', '#7777AA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060610', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
