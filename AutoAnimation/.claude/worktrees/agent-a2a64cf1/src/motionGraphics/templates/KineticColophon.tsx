import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ColophonConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Faint border frame, like an endpaper plate */}
      <div
        style={{
          position: 'absolute',
          inset: '6%',
          border: '0.5px solid rgba(120,100,70,0.08)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '7%',
          border: '0.5px solid rgba(120,100,70,0.05)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Colophon: decorative printer's mark with text arranged vertically
    let mainOpacity = 0
    let ornamentScale = 0
    let linesOpacity = 0
    let mainY = 0

    if (phase === 'enter') {
      // Ornament blooms from center first
      const ornPhase = Math.min(1, enterProgress * 2.5)
      const ornEase = 1 - Math.pow(1 - ornPhase, 3)
      ornamentScale = ornEase

      // Text fades in below
      const textPhase = Math.max(0, (enterProgress - 0.3) / 0.7)
      const textEase = 1 - Math.pow(1 - textPhase, 2)
      mainOpacity = textEase
      mainY = (1 - textEase) * 15

      // Colophon detail lines
      linesOpacity = Math.max(0, (enterProgress - 0.5) / 0.5)
    } else if (phase === 'hold') {
      ornamentScale = 1
      mainOpacity = 1
      linesOpacity = 1
      // Gentle pulse on ornament
      ornamentScale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.02
    } else {
      const fade = 1 - exitProgress
      ornamentScale = 1 - exitProgress * 0.3
      mainOpacity = fade
      linesOpacity = fade
    }

    // Decorative printer's mark ornaments (fleuron / aldus leaf)
    const fleuronChars = ['\u2766', '\u2767', '\u2619', '\u2723', '\u2756', '\u273F']
    const fleuron = fleuronChars[index % fleuronChars.length]

    return (
      <>
        {/* Top decorative rule */}
        <div
          style={{
            position: 'absolute',
            top: '22%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: linesOpacity * 0.4,
          }}
        >
          <div style={{ width: 50, height: 0.5, background: color }} />
          <div
            style={{
              fontFamily: 'serif',
              fontSize: 'clamp(8px, 2vw, 14px)',
              color,
            }}
          >
            {'\u2022'}
          </div>
          <div style={{ width: 50, height: 0.5, background: color }} />
        </div>

        {/* Printer's mark / fleuron */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            left: '50%',
            transform: `translateX(-50%) scale(${ornamentScale})`,
            transformOrigin: 'center',
            fontFamily: 'serif',
            fontSize: 'clamp(30px, 8vw, 80px)',
            color,
            opacity: ornamentScale * 0.45,
            lineHeight: 1,
          }}
        >
          {fleuron}
        </div>

        {/* Main word — the title or device */}
        <div
          style={{
            position: 'absolute',
            top: '46%',
            left: '50%',
            transform: `translateX(-50%) translateY(${mainY}px)`,
            opacity: mainOpacity,
            fontFamily: "'Georgia', 'Playfair Display', serif",
            fontSize: 'clamp(36px, 9vw, 120px)',
            fontWeight: 400,
            fontVariant: 'small-caps',
            letterSpacing: '0.18em',
            color,
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {word}
        </div>

        {/* Thin rule below word */}
        <div
          style={{
            position: 'absolute',
            top: '60%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '35%',
            height: 0.5,
            background: color,
            opacity: linesOpacity * 0.3,
          }}
        />

        {/* Colophon detail text */}
        <div
          style={{
            position: 'absolute',
            top: '64%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            opacity: linesOpacity * 0.3,
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(8px, 1.8vw, 13px)',
              fontStyle: 'italic',
              color,
              lineHeight: 1.8,
            }}
          >
            Set in Garamond & Caslon
          </div>
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(7px, 1.5vw, 11px)',
              color,
              lineHeight: 1.8,
              letterSpacing: '0.1em',
            }}
          >
            Printed on acid-free paper
          </div>
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(7px, 1.5vw, 11px)',
              color,
              lineHeight: 1.8,
              fontVariant: 'small-caps',
              letterSpacing: '0.15em',
            }}
          >
            First Edition, MMXXVI
          </div>
        </div>

        {/* Bottom ornament */}
        <div
          style={{
            position: 'absolute',
            bottom: '14%',
            left: '50%',
            transform: `translateX(-50%) scale(${ornamentScale * 0.7})`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: linesOpacity * 0.25,
          }}
        >
          <div style={{ width: 30, height: 0.5, background: color }} />
          <div
            style={{
              fontFamily: 'serif',
              fontSize: 'clamp(12px, 3vw, 22px)',
              color,
            }}
          >
            {'\u2053'}
          </div>
          <div style={{ width: 30, height: 0.5, background: color }} />
        </div>
      </>
    )
  },
}

function ColophonComponent(props: MotionGraphicProps<ColophonConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-colophon',
  title: 'Colophon',
  description: 'Classical book colophon with decorative printer\u2019s fleuron mark, small-caps text, typographic details. End-matter page of a fine press edition.',
  tags: ['kinetic', 'typography', 'colophon', 'book', 'editorial', 'print', 'fleuron', 'classical'],
  category: 'captions',
  component: ColophonComponent as any,
  defaultConfig: {
    words: ['FINIS', 'CODEX', 'PRESS', 'GUILD'],
    colors: ['#3C322A', '#3C322A', '#3C322A', '#3C322A'],
    bgColor: '#F5EFE0',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FINIS', 'CODEX', 'PRESS', 'GUILD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3C322A', '#3C322A', '#3C322A', '#3C322A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5EFE0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
