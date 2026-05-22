import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DropCapAnimateConfig extends KineticBaseConfig {
  accentColor: string
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const isDark = bgColor !== '#FAFAFA' && bgColor !== '#F4F1EC' && bgColor !== '#FFFFFF'
    const ruleColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Simulated body text lines (column filler) */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `calc(18% + ${i * 8.5}%)`,
              // Lines 0–2 are short (flow around drop cap); 3+ go full width
              left: i < 3 ? '28%' : '8%',
              right: '8%',
              height: 1,
              background: ruleColor,
              opacity: i < 3 ? 0.7 : 1,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // word = "BODY COPY FIRST WORD" — first character becomes the drop cap
    const firstChar = word.charAt(0)
    const restOfWord = word.slice(1)

    let dropCapScale = 0.2
    let dropCapOpacity = 0
    let dropCapX = 0
    let bodyOpacity = 0
    let bodyX = 0
    let accentLineWidth = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      // Drop cap scales up first with a slight left slide
      dropCapScale = 0.2 + eased * 0.8
      dropCapOpacity = Math.min(1, enterProgress * 3)
      dropCapX = (1 - eased) * -12
      // Body text slides in after
      bodyOpacity = Math.max(0, (enterProgress - 0.3) / 0.7)
      bodyX = (1 - Math.min(1, Math.max(0, (enterProgress - 0.3) / 0.7))) * 14
      // Accent rule extends with body text
      accentLineWidth = Math.max(0, (enterProgress - 0.4) / 0.6) * 100
    } else if (phase === 'hold') {
      dropCapScale = 1
      dropCapOpacity = 1
      dropCapX = 0
      bodyOpacity = 1
      bodyX = 0
      accentLineWidth = 100
    } else {
      // Drop cap shrinks, body fades
      dropCapOpacity = 1 - exitProgress
      dropCapScale = 1 - exitProgress * 0.15
      bodyOpacity = 1 - exitProgress * 1.5
      bodyX = exitProgress * 14
      accentLineWidth = (1 - exitProgress) * 100
    }

    const serif = "'Playfair Display', 'Georgia', 'Times New Roman', serif"
    const sans = "'Helvetica Neue', 'Arial', sans-serif"
    const accent = '#C9A84C'

    // Drop cap height: 3 lines of body text
    const DROP_CAP_SIZE = 'clamp(54px, 14vw, 190px)'
    const BODY_SIZE = 'clamp(11px, 2.6vw, 28px)'

    return (
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: '8%',
          right: '8%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '3%' }}>
          {/* Drop capital */}
          <div
            style={{
              flexShrink: 0,
              transform: `translateX(${dropCapX}px) scale(${dropCapScale})`,
              transformOrigin: 'top left',
              opacity: dropCapOpacity,
            }}
          >
            {/* Accent color block behind drop cap */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: -4,
                  right: -2,
                  height: `${accentLineWidth * 0.04}%`,
                  maxHeight: 4,
                  background: accent,
                  opacity: 0.8,
                }}
              />
              <div
                style={{
                  fontFamily: serif,
                  fontSize: DROP_CAP_SIZE,
                  fontWeight: 900,
                  lineHeight: 0.82,
                  color,
                  letterSpacing: '-0.02em',
                  userSelect: 'none',
                }}
              >
                {firstChar}
              </div>
            </div>
            {/* Thin accent rule below drop cap */}
            <div
              style={{
                width: `${accentLineWidth}%`,
                maxWidth: 'clamp(40px, 10vw, 120px)',
                height: 2,
                background: accent,
                marginTop: 8,
              }}
            />
          </div>

          {/* Body text — flows to the right and below drop cap */}
          <div
            style={{
              flex: 1,
              opacity: bodyOpacity,
              transform: `translateX(${bodyX}px)`,
            }}
          >
            {/* First word continuation */}
            <div
              style={{
                fontFamily: serif,
                fontSize: BODY_SIZE,
                fontWeight: 400,
                lineHeight: 1.55,
                color,
                letterSpacing: '0.02em',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontSize: 'clamp(10px, 2.2vw, 22px)',
                }}
              >
                {restOfWord.split(' ')[0]}
              </span>
              {restOfWord.slice(restOfWord.indexOf(' '))}
            </div>

            {/* Simulated paragraph body */}
            <div
              style={{
                fontFamily: sans,
                fontSize: 'clamp(8px, 1.8vw, 15px)',
                fontWeight: 300,
                lineHeight: 1.7,
                color,
                opacity: 0.5,
                marginTop: 8,
                letterSpacing: '0.01em',
              }}
            >
              The kind of prose that holds the eye to the page — a sentence that unfolds across
              the column with measured authority, each word chosen for weight as much as meaning.
            </div>
          </div>
        </div>
      </div>
    )
  },
}

function KineticDropCapAnimateComponent(props: MotionGraphicProps<DropCapAnimateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-drop-cap-animate',
  title: 'Drop Cap Animate',
  description: 'Oversized drop capital letter scales in with body text flowing around it. Classic editorial typographic technique from long-form magazine journalism.',
  tags: ['kinetic', 'typography', 'editorial', 'drop-cap', 'magazine', 'serif', 'longform', 'layout'],
  category: 'captions',
  component: KineticDropCapAnimateComponent as any,
  defaultConfig: {
    words: [
      'EVERY great city begins with a single act of vision.',
      'BEAUTY is not a luxury. It is an argument.',
      'POWER does not corrupt — it reveals.',
      'WHEN the data fails, intuition leads.',
    ],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#F4F1EC',
    cycleDuration: 2.5,
    accentColor: '#C9A84C',
  },
  configSchema: [
    { key: 'words', label: 'Opening Lines (first char = drop cap)', type: 'text-array', defaultValue: ['EVERY great city begins with a single act of vision.'], group: 'Content' },
    { key: 'colors', label: 'Text Color', type: 'text-array', defaultValue: ['#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F4F1EC', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A84C', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 0.5, max: 7, group: 'Timing' },
  ],
})
