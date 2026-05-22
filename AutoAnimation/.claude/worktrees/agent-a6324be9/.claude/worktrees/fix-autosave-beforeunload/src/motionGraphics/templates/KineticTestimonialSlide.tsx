import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TestimonialSlideConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Soft gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, rgba(99,102,241,0.04) 0%, transparent 50%, rgba(168,85,247,0.04) 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* Large quotation mark watermark */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '8%',
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(80px, 25vw, 250px)',
          color: 'rgba(255,255,255,0.03)',
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {'\u201C'}
      </div>
      {/* Closing quotation mark */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          right: '8%',
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(80px, 25vw, 250px)',
          color: 'rgba(255,255,255,0.03)',
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {'\u201D'}
      </div>
      {/* Thin border frame */}
      <div
        style={{
          position: 'absolute',
          inset: '6%',
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0

    if (phase === 'enter') {
      // Slide in from right
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      translateX = (1 - eased) * 80
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
    } else {
      // Slide out to left
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      translateX = -eased * 80
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px)`,
          opacity,
          textAlign: 'center',
          width: '80%',
          maxWidth: 600,
        }}
      >
        {/* Quote marks */}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(24px, 6vw, 48px)',
            color: `${color}40`,
            lineHeight: 1,
            marginBottom: 'clamp(4px, 1vw, 10px)',
          }}
        >
          {'\u201C'}
        </div>
        {/* Testimonial text */}
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(24px, 6vw, 72px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            lineHeight: 1.3,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {word}
        </div>
        {/* Closing quote */}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(24px, 6vw, 48px)',
            color: `${color}40`,
            lineHeight: 1,
            marginTop: 'clamp(4px, 1vw, 10px)',
          }}
        >
          {'\u201D'}
        </div>
        {/* Star rating */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 4,
            marginTop: 'clamp(8px, 2vw, 16px)',
            opacity: phase === 'enter' ? Math.max(0, (enterProgress - 0.5) * 2) : phase === 'exit' ? 1 - exitProgress : 1,
          }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              style={{
                fontSize: 'clamp(12px, 2.5vw, 20px)',
                color: '#FACC15',
              }}
            >
              {'\u2605'}
            </span>
          ))}
        </div>
        {/* Author line */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(10px, 2vw, 15px)',
            fontWeight: 600,
            color: `${color}60`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginTop: 'clamp(6px, 1.5vw, 12px)',
            opacity: phase === 'enter' ? Math.max(0, (enterProgress - 0.6) * 2.5) : phase === 'exit' ? 1 - exitProgress : 1,
          }}
        >
          {'\u2014'} Verified Customer
        </div>
      </div>
    )
  },
}

function KineticTestimonialSlideComponent(props: MotionGraphicProps<TestimonialSlideConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-testimonial-slide',
  title: 'Testimonial Slide',
  description: 'Testimonial text slides in from right with elegant serif font, quotation marks, star rating, and subtle frame border.',
  tags: ['kinetic', 'testimonial', 'review', 'marketing', 'trust', 'social-proof', 'quote'],
  category: 'captions',
  component: KineticTestimonialSlideComponent as any,
  defaultConfig: {
    words: ['Amazing!', 'Game changer', '10/10', 'Love it'],
    colors: ['#F1F5F9', '#E2E8F0', '#CBD5E1', '#F1F5F9'],
    bgColor: '#0f172a',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Testimonials', type: 'text-array', defaultValue: ['Amazing!', 'Game changer', '10/10', 'Love it'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F1F5F9', '#E2E8F0', '#CBD5E1', '#F1F5F9'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
