import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LookbookSlideConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Minimal grid lines
    const gridOpacity = 0.025 + Math.sin(time * 0.4) * 0.005
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Horizontal grid lines */}
        {[20, 40, 60, 80].map((pct) => (
          <div
            key={`h-${pct}`}
            style={{
              position: 'absolute',
              top: `${pct}%`,
              left: '5%',
              right: '5%',
              height: 0.5,
              background: `rgba(255,255,255,${gridOpacity})`,
            }}
          />
        ))}
        {/* Vertical grid lines */}
        {[20, 40, 60, 80].map((pct) => (
          <div
            key={`v-${pct}`}
            style={{
              position: 'absolute',
              left: `${pct}%`,
              top: '5%',
              bottom: '5%',
              width: 0.5,
              background: `rgba(255,255,255,${gridOpacity})`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    // Lookbook page: large number, title, season -- page turn effect
    const lookNumber = String(index + 1).padStart(2, '0')

    let opacity = 0
    let translateX = 0
    let numberScale = 1
    let lineClip = 0 // 0 to 1

    if (phase === 'enter') {
      // Page slide in from right
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = Math.min(1, enterProgress * 2.5)
      translateX = (1 - eased) * width * 0.15
      numberScale = 0.8 + eased * 0.2
      lineClip = eased
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
      numberScale = 1
      lineClip = 1
    } else {
      // Page slide out to left
      const eased = exitProgress * exitProgress
      opacity = 1 - exitProgress
      translateX = -eased * width * 0.15
      numberScale = 1 - eased * 0.2
      lineClip = 1 - eased
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${translateX}px)`,
          opacity,
        }}
      >
        {/* Large look number -- top left */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '10%',
            fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
            fontSize: 'clamp(60px, 18vw, 220px)',
            fontWeight: 100,
            color,
            opacity: 0.12,
            lineHeight: 0.85,
            transform: `scale(${numberScale})`,
            transformOrigin: 'top left',
          }}
        >
          {lookNumber}
        </div>

        {/* Horizontal divider */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '10%',
            width: `${lineClip * 80}%`,
            height: 0.5,
            background: color,
            opacity: 0.2,
          }}
        />

        {/* Season title -- centered */}
        <div
          style={{
            position: 'absolute',
            top: '53%',
            left: '10%',
            right: '10%',
          }}
        >
          <div
            style={{
              fontFamily: "'Helvetica Neue', 'Inter', 'Arial', sans-serif",
              fontSize: 'clamp(30px, 8vw, 100px)',
              fontWeight: 200,
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color,
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
            }}
          >
            {word}
          </div>
          {/* Season sub-label */}
          <div
            style={{
              fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
              fontSize: 'clamp(8px, 2vw, 14px)',
              fontWeight: 300,
              textTransform: 'uppercase',
              letterSpacing: '0.5em',
              color,
              opacity: 0.35,
              marginTop: 14,
            }}
          >
            Collection
          </div>
        </div>

        {/* Page footer -- right aligned */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            right: '10%',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 30,
              height: 0.5,
              background: color,
              opacity: 0.15,
            }}
          />
          <div
            style={{
              fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
              fontSize: 'clamp(7px, 1.4vw, 11px)',
              fontWeight: 300,
              letterSpacing: '0.3em',
              color,
              opacity: 0.2,
            }}
          >
            LOOKBOOK
          </div>
        </div>
      </div>
    )
  },
}

function KineticLookbookSlideComponent(props: MotionGraphicProps<LookbookSlideConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lookbook-slide',
  title: 'Lookbook Slide',
  description: 'Fashion lookbook page with large look number, season title, minimal grid background, and page-turn slide transitions.',
  tags: ['kinetic', 'typography', 'fashion', 'lookbook', 'page', 'minimal', 'grid', 'collection'],
  category: 'captions',
  component: KineticLookbookSlideComponent as any,
  defaultConfig: {
    words: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'],
    colors: ['#FAFAFA', '#FAFAFA', '#FAFAFA', '#FAFAFA'],
    bgColor: '#0A0A0A',
    cycleDuration: 2,
  },
  configSchema: [
    { key: 'words', label: 'Season Titles', type: 'text-array', defaultValue: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FAFAFA', '#FAFAFA', '#FAFAFA', '#FAFAFA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
