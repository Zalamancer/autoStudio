import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZipperRevealConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    let zipProgress = 0
    let textOpacity = 0

    if (phase === 'enter') {
      zipProgress = easeOutQuart(enterProgress)
      textOpacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      zipProgress = 1
      textOpacity = 1
    } else {
      zipProgress = 1 - easeOutQuart(exitProgress)
      textOpacity = 1 - exitProgress
    }

    // The zipper opens from top, revealing from y=0 down to zipY
    const zipY = zipProgress * height
    const centerX = width / 2

    // Zipper teeth along the center line
    const teethCount = 20
    const toothSpacing = height / teethCount
    const teeth = []
    for (let i = 0; i < teethCount; i++) {
      const toothY = i * toothSpacing
      const isOpen = toothY < zipY
      const toothSize = 6
      // Left and right teeth spread apart when open
      const spread = isOpen ? 12 : 0

      teeth.push(
        <div
          key={`l-${i}`}
          style={{
            position: 'absolute',
            left: centerX - toothSize - spread,
            top: toothY,
            width: toothSize,
            height: toothSize * 0.6,
            background: isOpen ? 'rgba(180,180,190,0.3)' : 'rgba(180,180,190,0.7)',
            borderRadius: 1,
            transition: 'none',
          }}
        />,
        <div
          key={`r-${i}`}
          style={{
            position: 'absolute',
            left: centerX + spread,
            top: toothY,
            width: toothSize,
            height: toothSize * 0.6,
            background: isOpen ? 'rgba(180,180,190,0.3)' : 'rgba(180,180,190,0.7)',
            borderRadius: 1,
            transition: 'none',
          }}
        />,
      )
    }

    // Zipper pull at the opening edge
    const pullY = Math.max(0, Math.min(height - 16, zipY))

    // Left curtain and right curtain that part at the zipper
    const curtainSpread = zipProgress * width * 0.6

    return (
      <>
        {/* Text layer visible through the opening */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            clipPath: `inset(0 0 ${100 - zipProgress * 100}% 0)`,
          }}
        >
          {word}
        </div>
        {/* Left curtain */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: centerX,
            height,
            background: 'linear-gradient(270deg, rgba(60,60,80,0.95), rgba(40,40,55,0.98))',
            transform: `translateX(${-curtainSpread / 2}px)`,
            clipPath: `inset(0 0 ${100 - zipProgress * 100}% 0)`,
          }}
        />
        {/* Right curtain */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: centerX,
            width: centerX,
            height,
            background: 'linear-gradient(90deg, rgba(60,60,80,0.95), rgba(40,40,55,0.98))',
            transform: `translateX(${curtainSpread / 2}px)`,
            clipPath: `inset(0 0 ${100 - zipProgress * 100}% 0)`,
          }}
        />
        {/* Closed area below zip */}
        <div
          style={{
            position: 'absolute',
            top: zipY,
            left: 0,
            width,
            height: height - zipY,
            background: 'linear-gradient(180deg, rgba(50,50,65,0.9), rgba(35,35,50,0.95))',
          }}
        >
          {/* Center seam line */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              width: 2,
              height: '100%',
              background: 'rgba(180,180,190,0.15)',
              transform: 'translateX(-50%)',
            }}
          />
        </div>
        {/* Zipper teeth */}
        {teeth}
        {/* Zipper pull handle */}
        <div
          style={{
            position: 'absolute',
            left: centerX - 8,
            top: pullY,
            width: 16,
            height: 20,
            background: 'linear-gradient(180deg, #C0C0C8, #888890)',
            borderRadius: 3,
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 6,
              height: 8,
              borderRadius: '0 0 3px 3px',
              border: '2px solid rgba(80,80,90,0.6)',
              borderTop: 'none',
            }}
          />
        </div>
      </>
    )
  },
}

function ZipperRevealComponent(props: MotionGraphicProps<ZipperRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zipper-reveal',
  title: 'Kinetic Zipper Reveal',
  description: 'Zipper opens down the middle to reveal text behind, with parting curtains and metallic zipper pull',
  tags: ['kinetic', 'typography', 'zipper', 'reveal', 'mechanical', 'geometric'],
  category: 'captions',
  component: ZipperRevealComponent as any,
  defaultConfig: {
    words: ['UNZIP', 'OPEN', 'PEEK', 'INSIDE'],
    colors: ['#FF9F43', '#EE5A24', '#F8C291', '#FFD93D'],
    bgColor: '#1a1a2e',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['UNZIP', 'OPEN', 'PEEK', 'INSIDE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF9F43', '#EE5A24', '#F8C291'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
