import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MastheadRevealConfig extends KineticBaseConfig {
  tagline: string
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle ivory paper texture via layered pseudo-gradients
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Top thick rule — masthead bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: '#1A1A1A',
          }}
        />
        {/* Bottom thick rule */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: '#1A1A1A',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Parse "MASTHEAD | Tagline | Vol. Issue"
    const parts = word.split('|').map((s) => s.trim())
    const masthead = parts[0] || word
    const tagline = parts[1] || 'The Magazine of Record'
    const volIssue = parts[2] || 'Vol. 1 · No. 1'

    let opacity = 0
    let scaleX = 0.92
    let topBarHeight = 0
    let letterSpacing = '0.12em'
    let subtextOpacity = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = Math.min(1, enterProgress * 2.5)
      scaleX = 0.92 + eased * 0.08
      topBarHeight = eased * 100
      subtextOpacity = Math.max(0, (enterProgress - 0.5) / 0.5)
    } else if (phase === 'hold') {
      opacity = 1
      scaleX = 1
      topBarHeight = 100
      subtextOpacity = 1
    } else {
      opacity = 1 - exitProgress
      scaleX = 1 - exitProgress * 0.06
      topBarHeight = (1 - exitProgress) * 100
      subtextOpacity = 1 - exitProgress * 2
    }

    const serif = "'Playfair Display', 'Georgia', 'Times New Roman', serif"
    const sans = "'Helvetica Neue', 'Arial', sans-serif"

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleX(${scaleX})`,
          width: '90%',
          opacity,
          textAlign: 'center',
        }}
      >
        {/* Top thin rule above masthead */}
        <div
          style={{
            width: `${topBarHeight}%`,
            height: 1,
            background: color,
            opacity: 0.3,
            margin: '0 auto',
            marginBottom: 12,
          }}
        />

        {/* Tagline — small caps above masthead */}
        <div
          style={{
            fontFamily: sans,
            fontSize: 'clamp(7px, 1.4vw, 11px)',
            fontWeight: 400,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color,
            opacity: subtextOpacity * 0.55,
            marginBottom: 8,
          }}
        >
          {tagline}
        </div>

        {/* Masthead nameplate — commanding serif */}
        <div
          style={{
            fontFamily: serif,
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 900,
            lineHeight: 0.88,
            color,
            letterSpacing: letterSpacing,
            textTransform: 'uppercase',
          }}
        >
          {masthead}
        </div>

        {/* Double rule below nameplate */}
        <div style={{ margin: '12px auto 0', width: '100%', position: 'relative' }}>
          <div
            style={{
              width: `${topBarHeight}%`,
              height: 3,
              background: color,
              margin: '0 auto',
            }}
          />
          <div
            style={{
              width: `${topBarHeight * 0.92}%`,
              height: 1,
              background: color,
              opacity: 0.4,
              margin: '3px auto 0',
            }}
          />
        </div>

        {/* Vol / Issue line */}
        <div
          style={{
            marginTop: 10,
            fontFamily: sans,
            fontSize: 'clamp(7px, 1.4vw, 11px)',
            fontWeight: 300,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color,
            opacity: subtextOpacity * 0.45,
          }}
        >
          {volIssue}
        </div>
      </div>
    )
  },
}

function KineticMastheadRevealComponent(props: MotionGraphicProps<MastheadRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-masthead-reveal',
  title: 'Masthead Reveal',
  description: 'Magazine masthead/nameplate reveal with commanding serif authority, double rule lines, and publication metadata. The gravitas of a print institution.',
  tags: ['kinetic', 'typography', 'masthead', 'magazine', 'editorial', 'serif', 'nameplate', 'publication'],
  category: 'captions',
  component: KineticMastheadRevealComponent as any,
  defaultConfig: {
    words: [
      'THE REVIEW | Journal of Ideas | Vol. 42 · No. 1',
      'CHRONICLE | The Magazine of Record | Spring 2026',
      'MERIDIAN | Arts & Culture Monthly | Issue 88',
      'OBSERVER | Dispatches from the World | Vol. 7',
    ],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#F4F1EC',
    cycleDuration: 2.5,
    tagline: 'The Magazine of Record',
  },
  configSchema: [
    { key: 'words', label: 'Mastheads (Name | Tagline | Vol.)', type: 'text-array', defaultValue: ['THE REVIEW | Journal of Ideas | Vol. 42 · No. 1'], group: 'Content' },
    { key: 'colors', label: 'Text Color', type: 'text-array', defaultValue: ['#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F4F1EC', group: 'Style' },
    { key: 'tagline', label: 'Default Tagline', type: 'text', defaultValue: 'The Magazine of Record', group: 'Content' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 0.5, max: 7, group: 'Timing' },
  ],
})
