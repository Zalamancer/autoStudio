import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SuctionPopConfig extends KineticBaseConfig {
  suctionForce: number
}

function elasticOut(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    // Pulsing suction vortex behind text
    const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.5 + 0.5
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(139,92,246,${0.06 + pulse * 0.04}) 0%, transparent 55%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Suction: text starts normal, gets PULLED toward center point (shrinks + moves to center),
    // then POPS back out to full size with elastic overshoot
    // Entry: appears large + spread, sucked to a tiny point at center, then POPS to normal

    let scale = 1
    let opacity = 0
    let translateX = 0
    let translateY = 0
    let blur = 0
    let scaleX = 1
    let scaleY = 1

    if (phase === 'enter') {
      // 0..0.4: sucked in from large/spread to tiny dot at center
      // 0.4..1: POP out with elastic overshoot
      if (enterProgress < 0.4) {
        const suckT = enterProgress / 0.4
        const eased = easeInExpo(suckT)
        // Start big and spread, collapse to center
        scale = 2.5 - eased * 2.1 // 2.5 -> ~0.4
        opacity = Math.max(0, 1 - eased * 0.6) // dims during suck
        blur = eased * 8
        // Letters converge — slight horizontal compress
        scaleX = 1 - eased * 0.3
        scaleY = 1 + eased * 0.5
      } else {
        // POP phase
        const popT = (enterProgress - 0.4) / 0.6
        const popped = elasticOut(popT)
        scale = 0.3 + popped * 0.7 // from tiny (0.3) to full (1.0)
        opacity = 0.4 + popped * 0.6
        blur = (1 - popT) * 4
        scaleX = 1 + (1 - popped) * 0.4
        scaleY = 1 - (1 - popped) * 0.3
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Gentle pulsing breathe — residual vacuum oscillation
      const breathe = Math.sin(holdProgress * Math.PI * 4) * Math.exp(-holdProgress * 3) * 0.04
      scaleX = 1 + breathe
      scaleY = 1 - breathe
    } else {
      // Exit: sucked BACK to the center point (reverse of pop)
      const suckT = exitProgress
      const eased = easeInExpo(suckT)
      scale = 1 - eased * 0.85
      opacity = 1 - eased
      scaleX = 1 + eased * 0.5
      scaleY = 1 - eased * 0.4
      blur = eased * 6
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) scaleX(${scaleX}) scaleY(${scaleY})`,
          transformOrigin: 'center center',
          opacity,
          filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            color,
            textShadow: `0 0 ${20 * (2 - scale)}px ${color}50, 3px 3px 0 rgba(0,0,0,0.3)`,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SuctionPopComponent(props: MotionGraphicProps<SuctionPopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-suction-pop',
  title: 'Kinetic Suction Pop',
  description: 'Text collapses inward as if sucked to a vacuum point, then pops outward with elastic spring back to full size',
  tags: ['kinetic', 'typography', 'suction', 'pop', 'physics', 'vacuum', 'elastic', 'implode'],
  category: 'captions',
  component: SuctionPopComponent as any,
  defaultConfig: {
    words: ['POP', 'SUCK', 'ZOOM', 'BURST'],
    colors: ['#C084FC', '#818CF8', '#38BDF8', '#F472B6'],
    bgColor: '#13001A',
    cycleDuration: 1.4,
    suctionForce: 100,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POP', 'SUCK', 'ZOOM', 'BURST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C084FC', '#818CF8', '#38BDF8', '#F472B6'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#13001A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'suctionForce', label: 'Suction Force', type: 'number', defaultValue: 100, min: 20, max: 200, group: 'Animation' },
  ],
})
