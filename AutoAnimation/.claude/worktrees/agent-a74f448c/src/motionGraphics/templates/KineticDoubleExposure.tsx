import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DoubleExposureConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Film gate flicker
    const flicker = 0.95 + Math.sin(time * 18) * 0.03 + Math.sin(time * 31) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, opacity: flicker }}>
        {/* Film grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.015) 1px, rgba(255,255,255,0.015) 2px)',
            pointerEvents: 'none',
          }}
        />
        {/* Light leak — first exposure residual */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '60%',
            height: '60%',
            background: 'radial-gradient(circle at 20% 20%, rgba(255,200,100,0.04), transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        {/* Film edge fogging */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(20,15,10,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Sprocket hole marks top */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: '10%',
            right: '10%',
            height: 3,
            backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 8px, transparent 8px, transparent 24px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 53 + 41

    // Two exposure layers with independent motion
    let layer1Opacity = 0
    let layer2Opacity = 0
    let layer1X = 0
    let layer1Y = 0
    let layer2X = 0
    let layer2Y = 0
    let layer1Scale = 1
    let layer2Scale = 1

    if (phase === 'enter') {
      // First exposure fades in, second follows slightly delayed
      layer1Opacity = Math.min(enterProgress * 1.5, 1) * 0.7
      layer2Opacity = Math.max(0, (enterProgress - 0.3) / 0.7) * 0.6
      layer1X = (1 - enterProgress) * -15
      layer2X = (1 - enterProgress) * 12
      layer1Y = (1 - enterProgress) * -8
      layer2Y = (1 - enterProgress) * 6
      layer1Scale = 0.95 + enterProgress * 0.05
      layer2Scale = 1.02 - enterProgress * 0.02
    } else if (phase === 'hold') {
      layer1Opacity = 0.7
      layer2Opacity = 0.6
      // Gentle drift — two exposures slowly separating and converging
      const drift = Math.sin(f * 0.04 + seed) * 4
      layer1X = drift
      layer2X = -drift * 0.8
      layer1Y = Math.cos(f * 0.03 + seed) * 3
      layer2Y = -Math.cos(f * 0.03 + seed) * 2
      layer1Scale = 1 + Math.sin(f * 0.02) * 0.01
      layer2Scale = 1 - Math.sin(f * 0.02) * 0.01
    } else {
      layer1Opacity = 0.7 * (1 - exitProgress)
      layer2Opacity = 0.6 * (1 - exitProgress * 0.8)
      layer1X = exitProgress * 20
      layer2X = exitProgress * -15
      layer1Y = exitProgress * -10
      layer2Y = exitProgress * 8
    }

    return (
      <>
        {/* First exposure — warmer tone */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${layer1X}px), calc(-50% + ${layer1Y}px)) scale(${layer1Scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(255,220,180,0.9)',
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: layer1Opacity,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Second exposure — cooler tone */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${layer2X}px), calc(-50% + ${layer2Y}px)) scale(${layer2Scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color: 'rgba(180,200,255,0.9)',
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: layer2Opacity,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Combined visible layer — the final merged image */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${(layer1X + layer2X) / 2}px), calc(-50% + ${(layer1Y + layer2Y) / 2}px))`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: Math.min(layer1Opacity, layer2Opacity) * 0.8,
            textShadow: '0 0 10px rgba(255,255,255,0.15)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function DoubleExposureComponent(props: MotionGraphicProps<DoubleExposureConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-double-exposure',
  title: 'Kinetic Double Exposure',
  description: 'Film double exposure: two layers of text overlap and blend with ghost-like superimposition and shifting opacity',
  tags: ['kinetic', 'typography', 'double-exposure', 'film', 'photography', 'darkroom', 'ghost', 'overlay'],
  category: 'captions',
  component: DoubleExposureComponent as any,
  defaultConfig: {
    words: ['GHOST', 'DOUBLE', 'LAYER', 'MERGE'],
    colors: ['#e0d8c8', '#d8d0c0', '#c8c0b0', '#e8e0d0'],
    bgColor: '#0c0a08',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GHOST', 'DOUBLE', 'LAYER', 'MERGE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e0d8c8', '#d8d0c0', '#c8c0b0', '#e8e0d0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0a08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
