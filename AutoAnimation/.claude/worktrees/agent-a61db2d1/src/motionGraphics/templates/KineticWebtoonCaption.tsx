import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WebtoonCaptionConfig extends KineticBaseConfig {}

// Korean webtoon / K-drama style: full-color vertical scroll aesthetic,
// clean rounded speech bubble panels, bright pop colors, emoji-adjacent emphasis
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Soft diagonal gradient panels — webtoon panel feel
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Panel lines — webtoon panel borders */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '33.3% 50%',
          }}
        />
        {/* Soft vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(time * 0.5) * 10}% 50%, transparent 40%, rgba(0,0,0,0.08) 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scale = 1
    const seed = index * 29 + 5

    if (phase === 'enter') {
      // Pop up from slight below — webtoon reveal style
      opacity = Math.min(1, enterProgress * 3)
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      translateY = (1 - ease) * 20
      scale = 0.85 + ease * 0.15
      // Overshoot spring
      if (enterProgress > 0.8) {
        const t = (enterProgress - 0.8) / 0.2
        scale = 1 + Math.sin(t * Math.PI) * 0.08
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Slight heartbeat pulse
      scale = 1 + Math.sin(Date.now() * 0.005 + seed) * 0.02
    } else {
      opacity = 1 - exitProgress * 2
      translateY = -exitProgress * 15
      scale = 1 + exitProgress * 0.05
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity: Math.max(0, opacity),
        }}
      >
        {/* Speech bubble / caption box */}
        <div
          style={{
            background: 'rgba(255,255,255,0.92)',
            borderRadius: '16px',
            padding: 'clamp(8px, 2vw, 20px) clamp(16px, 4vw, 40px)',
            border: `3px solid ${color}`,
            boxShadow: `4px 4px 0 ${color}, 0 8px 24px rgba(0,0,0,0.15)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Trebuchet MS', 'Arial Rounded MT Bold', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(28px, 8vw, 110px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 1,
              textShadow: `1px 1px 0 rgba(0,0,0,0.1)`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function WebtoonCaptionComponent(props: MotionGraphicProps<WebtoonCaptionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-webtoon-caption',
  title: 'Kinetic Webtoon Caption',
  description: 'Korean webtoon / K-drama caption style with speech bubble panels, bright pop colors, rounded borders, and spring pop-up reveal',
  tags: ['kinetic', 'typography', 'webtoon', 'korean', 'k-drama', 'caption', 'speech-bubble', 'manhwa'],
  category: 'captions',
  component: WebtoonCaptionComponent as any,
  defaultConfig: {
    words: ['DAEBAK', 'AIGOO', 'HWAITING', 'SARANGHAE'],
    colors: ['#FF6B9D', '#C850C0', '#4481EB', '#FF9A3C'],
    bgColor: '#FFF5F8',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DAEBAK', 'AIGOO', 'HWAITING', 'SARANGHAE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B9D', '#C850C0', '#4481EB', '#FF9A3C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5F8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
