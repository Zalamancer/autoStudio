import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WordArtConfig extends KineticBaseConfig {}

// WordArt preset styles — Microsoft Word Art gallery
const WORDART_STYLES = [
  {
    // Style 1: Rainbow arch with hard 3D bevel shadow
    gradient:
      'linear-gradient(135deg, #FF0000 0%, #FF8800 16%, #FFFF00 33%, #00FF00 50%, #0088FF 66%, #8800FF 83%, #FF00FF 100%)',
    shadow: '4px 4px 0px rgba(0,0,0,0.6), 8px 8px 0px rgba(0,0,0,0.3)',
    stroke: '2px solid rgba(0,0,0,0.5)',
    skewX: -8,
    scaleY: 1.0,
  },
  {
    // Style 2: Gold metallic bevel
    gradient: 'linear-gradient(180deg, #FFFACD 0%, #FFD700 25%, #FFA500 50%, #FFD700 75%, #FFF8DC 100%)',
    shadow: '3px 3px 0px #8B6914, 6px 6px 0px rgba(0,0,0,0.4)',
    stroke: '1.5px solid #8B6914',
    skewX: 0,
    scaleY: 1.15,
  },
  {
    // Style 3: Silver/chrome curved
    gradient: 'linear-gradient(180deg, #FFFFFF 0%, #C0C0C0 30%, #808080 50%, #C0C0C0 70%, #FFFFFF 100%)',
    shadow: '2px 2px 0px #404040, 5px 5px 0px rgba(0,0,0,0.3)',
    stroke: '1px solid #606060',
    skewX: 5,
    scaleY: 0.9,
  },
  {
    // Style 4: Blue-to-teal gradient (classic blue WordArt)
    gradient: 'linear-gradient(180deg, #87CEEB 0%, #1E90FF 30%, #0050C0 60%, #003090 100%)',
    shadow: '3px 3px 0px #001060, 6px 6px 0px rgba(0,0,60,0.4)',
    stroke: '1.5px solid #001060',
    skewX: -5,
    scaleY: 1.0,
  },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          overflow: 'hidden',
          fontFamily: "'Arial', sans-serif",
        }}
      >
        {/* Word document page lines simulation */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(173,216,230,0.3) 24px, rgba(173,216,230,0.3) 25px)',
            pointerEvents: 'none',
          }}
        />

        {/* Left margin line */}
        <div
          style={{
            position: 'absolute',
            left: 'clamp(30px, 8vw, 60px)',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(255,200,200,0.4)',
          }}
        />

        {/* Word toolbar simulation at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 'clamp(18px, 5vw, 36px)',
            background: 'linear-gradient(180deg, #ECE9D8 0%, #D4D0C8 100%)',
            borderBottom: '1px solid #ACA899',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
            gap: 2,
          }}
        >
          {/* Toolbar buttons */}
          {['B', 'I', 'U', '|', 'A', 'A*'].map((btn, i) => (
            <div
              key={i}
              style={{
                width: btn === '|' ? 1 : 'clamp(14px, 3.5vw, 22px)',
                height: btn === '|' ? '70%' : 'clamp(14px, 3.5vw, 22px)',
                background: btn === '|' ? '#A0A090' : i === 0 ? '#B8D4F8' : '#E8E4DC',
                border: btn === '|' ? 'none' : '1px solid #ACA899',
                display: btn === '|' ? 'block' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(7px, 1.8vw, 12px)',
                fontWeight: i === 0 ? 700 : 400,
                fontStyle: i === 1 ? 'italic' : 'normal',
                textDecoration: i === 2 ? 'underline' : 'none',
                color: '#000',
                cursor: 'pointer',
              }}
            >
              {btn !== '|' ? btn : undefined}
            </div>
          ))}
          <span
            style={{
              fontFamily: "'Arial', sans-serif",
              fontSize: 'clamp(7px, 1.6vw, 11px)',
              color: '#404040',
              marginLeft: 8,
            }}
          >
            WordArt Gallery
          </span>
        </div>

        {/* Clip art style decoration in corner */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(40px, 10vw, 65px)',
            right: 'clamp(6px, 2vw, 16px)',
            fontSize: 'clamp(16px, 5vw, 40px)',
            opacity: 0.2,
            transform: `rotate(${Math.sin(time * 0.4) * 5}deg)`,
          }}
        >
          ✂️
        </div>
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const styleIndex = index % WORDART_STYLES.length
    const style = WORDART_STYLES[styleIndex]

    let opacity = 1
    let scale = 1
    let rotate = 0
    let translateY = 0

    // WordArt enters with a dramatic arc — comes sweeping in
    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = eased
      scale = 0.3 + eased * 0.7
      rotate = (1 - eased) * -15
      translateY = (1 - eased) * 50
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.02
      rotate = Math.sin(holdProgress * Math.PI * 1.5) * 1.5
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.2
      rotate = exitProgress * 10
    }

    // Curved arch effect — letters follow a sine arc via vertical offset per character
    const letters = word.toUpperCase().split('')
    const arcHeight = 20 + Math.sin(holdProgress * Math.PI) * 5

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          textAlign: 'center',
        }}
      >
        {/* 3D bevel shadow layers — WordArt's signature depth */}
        {[6, 4, 2].map((offset, si) => (
          <div
            key={si}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: `translate(${offset}px, ${offset}px) skewX(${style.skewX}deg) scaleY(${style.scaleY})`,
              fontFamily: "'Impact', 'Arial Black', 'Haettenschweiler', sans-serif",
              fontSize: 'clamp(40px, 12vw, 150px)',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              color: `rgba(0,0,0,${0.25 - si * 0.07})`,
            }}
          >
            {word.toUpperCase()}
          </div>
        ))}

        {/* Main WordArt text with gradient */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            transform: `skewX(${style.skewX}deg) scaleY(${style.scaleY})`,
          }}
        >
          {letters.map((letter, li) => {
            // Arc: each letter raised/lowered based on position
            const archOffset = -arcHeight * Math.sin((li / Math.max(letters.length - 1, 1)) * Math.PI)
            return (
              <span
                key={li}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Impact', 'Arial Black', 'Haettenschweiler', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 150px)',
                  fontWeight: 900,
                  background: style.gradient,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                  WebkitTextStroke: style.stroke,
                  transform: `translateY(${archOffset}px)`,
                  filter: `drop-shadow(2px 2px 0px rgba(0,0,0,0.5)) drop-shadow(4px 4px 0px rgba(0,0,0,0.25))`,
                  lineHeight: 1.1,
                }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </span>
            )
          })}
        </div>
      </div>
    )
  },
}

function WordArtComponent(props: MotionGraphicProps<WordArtConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-word-art',
  title: 'Kinetic WordArt',
  description:
    'Microsoft Word Art: rainbow gradient, gold metallic, silver chrome, and blue presets with arched letter layout, 3D bevel shadow, and skewed Impact font',
  tags: [
    'kinetic',
    'typography',
    'wordart',
    'microsoft',
    'office',
    'rainbow',
    'gradient',
    'bevel',
    'nostalgia',
    '90s',
    '2000s',
  ],
  category: 'captions',
  component: WordArtComponent as any,
  defaultConfig: {
    words: ['AWESOME', 'COOL', 'WOW', 'YES'],
    colors: ['#FF0000', '#FFD700', '#C0C0C0', '#1E90FF'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['AWESOME', 'COOL', 'WOW', 'YES'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF0000', '#FFD700', '#C0C0C0', '#1E90FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
  ],
})
