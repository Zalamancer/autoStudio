import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SilentFilmCardConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Sepia flicker — vintage frame rate simulation
    const flicker = 0.88 + 0.07 * Math.sin(time * 18.7) + 0.03 * Math.sin(time * 41.3) + 0.02 * Math.sin(time * 97.1)
    // Aging vignette pulse
    const vignetteStr = 0.55 + 0.05 * Math.sin(time * 3.2)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Aged sepia background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(32,22,10,${flicker})`,
          }}
        />
        {/* Intertitle card — lighter sepia center panel */}
        <div
          style={{
            position: 'absolute',
            inset: '5% 6%',
            background: `rgba(62,42,18,${0.95 * flicker})`,
          }}
        />
        {/* Ornate border — outer rule */}
        <div
          style={{
            position: 'absolute',
            inset: '5% 6%',
            border: `4px solid rgba(180,140,80,${0.6 * flicker})`,
          }}
        />
        {/* Ornate border — inner rule */}
        <div
          style={{
            position: 'absolute',
            inset: '8% 9%',
            border: `1px solid rgba(180,140,80,${0.4 * flicker})`,
          }}
        />
        {/* Corner ornaments — decorative diamond shapes */}
        {[
          { top: '6.5%', left: '7.5%' },
          { top: '6.5%', right: '7.5%' },
          { bottom: '6.5%', left: '7.5%' },
          { bottom: '6.5%', right: '7.5%' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...pos,
              width: 14,
              height: 14,
              background: `rgba(180,140,80,${0.5 * flicker})`,
              transform: 'rotate(45deg)',
            }}
          />
        ))}
        {/* Horizontal rule above text area */}
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '12%',
            right: '12%',
            height: 1,
            background: `rgba(160,120,60,${0.3 * flicker})`,
          }}
        />
        {/* Horizontal rule below text area */}
        <div
          style={{
            position: 'absolute',
            bottom: '38%',
            left: '12%',
            right: '12%',
            height: 1,
            background: `rgba(160,120,60,${0.3 * flicker})`,
          }}
        />
        {/* Film scratches */}
        <div
          style={{
            position: 'absolute',
            left: '31%',
            top: 0,
            bottom: 0,
            width: 1,
            background: `rgba(200,160,80,${0.06 * flicker})`,
          }}
        />
        {/* Sprocket holes */}
        {[10, 30, 50, 70, 90].map((y, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div
              style={{
                position: 'absolute',
                left: '1%',
                top: `${y}%`,
                width: 8,
                height: 12,
                borderRadius: 1,
                background: 'rgba(0,0,0,0.5)',
                transform: 'translateY(-50%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '1%',
                top: `${y}%`,
                width: 8,
                height: 12,
                borderRadius: 1,
                background: 'rgba(0,0,0,0.5)',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
        ))}
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(10,6,2,${vignetteStr}) 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 24
    const flicker = 0.9 + 0.07 * Math.sin(time * 19.3) + 0.03 * Math.sin(time * 43.7)

    // Silent film intertitle: text fades in with slight iris/vignette reveal
    let opacity = 0
    let scale = 1

    if (phase === 'enter') {
      const eased = enterProgress < 0.5
        ? 2 * enterProgress * enterProgress
        : 1 - Math.pow(-2 * enterProgress + 2, 2) / 2  // ease-in-out quad
      opacity = eased
      scale = 0.97 + eased * 0.03
    } else if (phase === 'hold') {
      opacity = flicker  // constant sepia flicker
      scale = 1
    } else {
      const eased = exitProgress < 0.5
        ? 2 * exitProgress * exitProgress
        : 1 - Math.pow(-2 * exitProgress + 2, 2) / 2
      opacity = (1 - eased) * flicker
      scale = 1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          textAlign: 'center',
          width: '76%',
        }}
      >
        {/* Decorative text — ornate serif, all caps */}
        <div
          style={{
            fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', serif",
            fontSize: 'clamp(34px, 8.5vw, 120px)',
            fontWeight: 700,
            fontVariant: 'small-caps',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            textShadow: `0 2px 8px rgba(0,0,0,0.6), 0 0 20px rgba(180,140,60,${opacity * 0.4})`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SilentFilmCardComponent(props: MotionGraphicProps<SilentFilmCardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-silent-film-card',
  title: 'Kinetic Silent Film Card',
  description: 'Silent film intertitle with ornate sepia border, decorative corner marks, sprocket holes, vintage flicker, and Palatino small-caps text fading in',
  tags: ['kinetic', 'typography', 'silent-film', 'intertitle', 'vintage', 'sepia', 'cinema', 'classic', '1920s'],
  category: 'captions',
  component: SilentFilmCardComponent as any,
  defaultConfig: {
    words: ['MEANWHILE', 'LATER', 'THE END'],
    colors: ['#d4aa60', '#c8a050', '#d4aa60'],
    bgColor: '#1e120a',
    cycleDuration: 2.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MEANWHILE', 'LATER', 'THE END'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#d4aa60', '#c8a050', '#d4aa60'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e120a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 0.5, max: 7, group: 'Timing' },
  ],
})
