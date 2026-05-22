import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FashionEditorialConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Thin cross-hair lines for editorial feel */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '8%',
          right: '8%',
          height: 0.5,
          background: bgColor === '#0a0a0a' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '8%',
          bottom: '8%',
          width: 0.5,
          background: bgColor === '#0a0a0a' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let letterSpacingExtra = 0
    let y = 0

    if (phase === 'enter') {
      // Elegant fade up with expanding letter-spacing
      opacity = Math.min(1, enterProgress * 2)
      letterSpacingExtra = (1 - enterProgress) * 20
      y = (1 - enterProgress) * 15
    } else if (phase === 'hold') {
      opacity = 1
      letterSpacingExtra = 0
    } else {
      // Fade out with contracting letter-spacing
      opacity = 1 - exitProgress
      letterSpacingExtra = exitProgress * 10
      y = exitProgress * -10
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${y}px)`,
          opacity,
          fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 100,
          textTransform: 'uppercase',
          letterSpacing: `${0.35 + letterSpacingExtra * 0.01}em`,
          color,
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}
      >
        {word}
      </div>
    )
  },
}

function KineticFashionEditorialComponent(props: MotionGraphicProps<FashionEditorialConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fashion-editorial',
  title: 'Fashion Editorial',
  description: 'High fashion editorial text with ultra-thin weight, wide letter-spacing, all caps. Luxury magazine aesthetic.',
  tags: ['kinetic', 'typography', 'fashion', 'editorial', 'luxury', 'magazine', 'minimal'],
  category: 'captions',
  component: KineticFashionEditorialComponent as any,
  defaultConfig: {
    words: ['VOGUE', 'COUTURE', 'ELEGANCE', 'LUXE'],
    colors: ['#fafafa', '#fafafa', '#fafafa', '#fafafa'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VOGUE', 'COUTURE', 'ELEGANCE', 'LUXE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#fafafa', '#fafafa', '#fafafa', '#fafafa'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
