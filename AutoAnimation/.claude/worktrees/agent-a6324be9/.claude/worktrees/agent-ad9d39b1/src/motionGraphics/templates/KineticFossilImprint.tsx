import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Easing: exponential ease-out for the "press into stone" snap
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Easing: ease-in cubic for the "erode away" exit
function easeInCubic(t: number): number {
  return t * t * t
}

interface FossilImprintConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    // Slow ambient rock-surface shimmer — tiny oscillation in brightness
    const shimmer = Math.sin((frame / fps) * 0.8) * 0.015
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          // Layered radial gradients simulate uneven stone surface
          backgroundImage: [
            `radial-gradient(ellipse 60% 40% at 20% 30%, rgba(255,255,255,${0.06 + shimmer}) 0%, transparent 60%)`,
            `radial-gradient(ellipse 80% 50% at 80% 70%, rgba(0,0,0,${0.08 - shimmer}) 0%, transparent 55%)`,
            `radial-gradient(ellipse 40% 60% at 50% 50%, rgba(0,0,0,0.04) 0%, transparent 70%)`,
          ].join(', '),
        }}
      />
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const ep = easeOutExpo(enterProgress)
    const xp = easeInCubic(exitProgress)

    // Enter: word slams DOWN from above (like pressing a fossil into sediment),
    // then settles with a tiny bounce. Simultaneously a "depth shadow" fills in.
    let translateY = 0
    let scaleY = 1
    let shadowBlur = 0
    let shadowOpacity = 0
    let textOpacity = 1
    let embossDepth = 0

    if (phase === 'enter') {
      // Drop from -60px → settle at 0, with slight overshoot bounce
      const bounce = enterProgress > 0.7
        ? Math.sin((enterProgress - 0.7) / 0.3 * Math.PI) * 3
        : 0
      translateY = (1 - ep) * -60 + bounce
      scaleY = 0.88 + ep * 0.12
      textOpacity = Math.min(1, enterProgress * 3)
      embossDepth = ep
      shadowBlur = ep * 8
      shadowOpacity = ep * 0.6
    } else if (phase === 'hold') {
      embossDepth = 1
      shadowBlur = 8
      shadowOpacity = 0.6
    } else if (phase === 'exit') {
      // Erode: text crumbles upward as if weathered away
      translateY = -xp * 20
      textOpacity = 1 - xp
      embossDepth = 1 - xp
      shadowBlur = (1 - xp) * 8
      shadowOpacity = (1 - xp) * 0.6
      // Slight horizontal skew as it crumbles
      const crumbleSkew = Math.sin(xp * Math.PI * 3 + (frame % 7)) * xp * 2
      translateY += crumbleSkew * 0.5
    }

    // Fossil imprint effect: inset shadow + slight scale compression on Y axis
    const textShadow = [
      `0px ${(embossDepth * 2).toFixed(1)}px ${shadowBlur.toFixed(1)}px rgba(0,0,0,${shadowOpacity.toFixed(2)})`,
      `0px ${-(embossDepth * 1).toFixed(1)}px ${(shadowBlur * 0.4).toFixed(1)}px rgba(255,255,255,${(shadowOpacity * 0.3).toFixed(2)})`,
    ].join(', ')

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY.toFixed(2)}px) scaleY(${scaleY.toFixed(4)})`,
          opacity: textOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(40px, 8.5vw, 126px)',
            fontWeight: 900,
            letterSpacing: '0.12em',
            color,
            whiteSpace: 'nowrap',
            textShadow,
            // Slight sepia filter deepens the fossilized look
            filter: `sepia(${(embossDepth * 0.35).toFixed(2)}) contrast(${(1 + embossDepth * 0.15).toFixed(2)})`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function FossilImprintComponent(props: MotionGraphicProps<FossilImprintConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fossil-imprint',
  title: 'Fossil Imprint',
  description:
    'Text slams into stone like a fossil being pressed into sediment, settling with embossed depth shadows. On exit it erodes and crumbles upward.',
  tags: ['kinetic', 'typography', 'archaeology', 'ancient', 'fossil', 'stone', 'imprint', 'impact'],
  category: 'captions',
  component: FossilImprintComponent as any,
  defaultConfig: {
    words: ['ANCIENT', 'PRIMORDIAL', 'BURIED', 'FOUND'],
    colors: ['#3d2b1f', '#2e1f0f', '#3d2b1f', '#2e1f0f'],
    bgColor: '#b09070',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ANCIENT', 'PRIMORDIAL', 'BURIED', 'FOUND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3d2b1f', '#2e1f0f', '#3d2b1f', '#2e1f0f'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#b09070', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.8, max: 5, group: 'Timing' },
  ],
})
