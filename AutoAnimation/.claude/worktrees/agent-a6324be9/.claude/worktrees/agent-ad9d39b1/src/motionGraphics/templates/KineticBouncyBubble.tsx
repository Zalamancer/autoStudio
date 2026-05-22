import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BouncyBubbleConfig extends KineticBaseConfig {
  bubbleRadius: number
}

function bounceEase(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) {
    t -= 1.5 / 2.75
    return 7.5625 * t * t + 0.75
  }
  if (t < 2.5 / 2.75) {
    t -= 2.25 / 2.75
    return 7.5625 * t * t + 0.9375
  }
  t -= 2.625 / 2.75
  return 7.5625 * t * t + 0.984375
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    height,
  }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let scale = 1
    let bubbleScale = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 3)
      // Multi-bounce physics: ball drops and bounces with decreasing height
      const bounced = bounceEase(enterProgress)
      translateY = (1 - bounced) * -(height * 0.5)
      bubbleScale = 0.2 + bounced * 0.8
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle floating motion
      translateY = Math.sin(holdProgress * Math.PI * 4) * 8
      bubbleScale = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.04
    } else {
      // Pop exit: scale up then vanish
      if (exitProgress < 0.3) {
        // Expand
        bubbleScale = 1 + exitProgress / 0.3 * 0.5
        opacity = 1
      } else {
        // Shrink to nothing
        const shrinkT = (exitProgress - 0.3) / 0.7
        bubbleScale = 1.5 * (1 - shrinkT)
        opacity = 1 - shrinkT
      }
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
        }}
      >
        {/* Bubble/pill shape */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(16px, 4vw, 40px) clamp(32px, 8vw, 80px)',
            borderRadius: '9999px',
            background: color,
            transform: `scale(${bubbleScale})`,
            boxShadow: `0 8px 32px ${color}66, inset 0 -4px 12px rgba(0,0,0,0.15), inset 0 4px 12px rgba(255,255,255,0.2)`,
          }}
        >
          {/* Shine highlight */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '20%',
              width: '30%',
              height: '20%',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              filter: 'blur(4px)',
            }}
          />
          <span
            style={{
              fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
              fontSize: 'clamp(28px, 8vw, 100px)',
              fontWeight: 700,
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function BouncyBubbleComponent(props: MotionGraphicProps<BouncyBubbleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bouncy-bubble',
  title: 'Bouncy Bubble',
  description:
    'Text inside a colorful bubble that bounces in like a ball with physics. Pops on exit.',
  tags: ['kinetic', 'bubble', 'bounce', 'pill', 'playful', 'fun', 'pop'],
  category: 'captions',
  component: BouncyBubbleComponent as any,
  defaultConfig: {
    words: ['YES!', 'NO WAY', 'OMG', 'WAIT'],
    colors: ['#FF6B9D', '#C06CF3', '#00C9A7', '#FFB347'],
    bgColor: '#0f0f23',
    cycleDuration: 1,
    bubbleRadius: 50,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['YES!', 'NO WAY', 'OMG', 'WAIT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Bubble Colors',
      type: 'text-array',
      defaultValue: ['#FF6B9D', '#C06CF3', '#00C9A7', '#FFB347'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f23', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'bubbleRadius',
      label: 'Bubble Radius',
      type: 'number',
      defaultValue: 50,
      min: 20,
      max: 100,
      group: 'Style',
    },
  ],
})
