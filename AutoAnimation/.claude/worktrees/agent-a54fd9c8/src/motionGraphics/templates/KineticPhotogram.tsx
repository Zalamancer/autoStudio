import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PhotogramConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Enlarger light swing — subtle directional shift
    const lightAngle = 50 + Math.sin(time * 0.6) * 8
    const lightY = 30 + Math.sin(time * 0.4) * 10

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Darkroom paper base — deep black photographic paper */}
        {/* Enlarger light source gradient — where light hits paper directly it exposes to black */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${lightAngle}% ${lightY}%, rgba(255,255,255,0.03), transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Paper fiber texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(120deg, transparent, transparent 4px, rgba(255,255,255,0.01) 4px, rgba(255,255,255,0.01) 5px)',
            pointerEvents: 'none',
          }}
        />
        {/* Light scatter at edges from objects not fully blocking */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 45%, rgba(40,35,50,0.3) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Random scattered objects — small circle shadows as if items on paper */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '8%',
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(200,195,210,0.04)',
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            right: '12%',
            width: 20,
            height: 45,
            borderRadius: 3,
            background: 'rgba(200,195,210,0.03)',
            transform: 'rotate(25deg)',
            filter: 'blur(1px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 67 + 19
    let opacity = 0
    let shadowSpread = 0

    if (phase === 'enter') {
      // Light exposes around the letter shapes — shadow appears where letters block light
      // The white silhouette emerges as surrounding area darkens
      opacity = enterProgress * enterProgress
      // Penumbra shadow grows as exposure time increases
      shadowSpread = enterProgress * 15
    } else if (phase === 'hold') {
      opacity = 1
      shadowSpread = 15 + Math.sin(f * 0.05 + seed) * 2
    } else {
      // Over-exposure — shadow bleeds into the letter shapes
      opacity = 1 - exitProgress * 0.8
      shadowSpread = 15 + exitProgress * 10
    }

    // Slight object-on-paper shift — as if the letter cutouts are slightly floating
    const floatY = Math.sin(f * 0.03 + seed) * 1.5

    return (
      <>
        {/* Penumbra / soft shadow halo around letters — light wrapping around edges */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${floatY}px))`,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color: 'transparent',
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            textTransform: 'uppercase',
            WebkitTextStroke: `1px rgba(180,175,195,${opacity * 0.15})`,
            textShadow: `0 0 ${shadowSpread}px rgba(20,15,30,0.6), 0 0 ${shadowSpread * 2}px rgba(20,15,30,0.3)`,
            opacity,
          }}
        >
          {word}
        </div>
        {/* Main letter silhouette — white where light was blocked by the object */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${floatY}px))`,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            textTransform: 'uppercase',
            opacity,
          }}
        >
          {word}
        </div>
        {/* Rayograph edge glow — light diffracting around object edges */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${floatY + 1}px))`,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color: 'rgba(220,215,230,0.08)',
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            textTransform: 'uppercase',
            opacity: opacity * 0.5,
            filter: `blur(${3 + shadowSpread * 0.2}px)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function PhotogramComponent(props: MotionGraphicProps<PhotogramConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-photogram',
  title: 'Kinetic Photogram',
  description: 'Photogram silhouette: letters appear as white shadows on dark paper where light was blocked, with rayograph penumbra aesthetic',
  tags: ['kinetic', 'typography', 'photogram', 'rayograph', 'silhouette', 'darkroom', 'shadow', 'man-ray'],
  category: 'captions',
  component: PhotogramComponent as any,
  defaultConfig: {
    words: ['SHADOW', 'LIGHT', 'OBJECT', 'TRACE'],
    colors: ['#dcd8e6', '#ccc8d8', '#e8e4f0', '#bab6c8'],
    bgColor: '#0a0812',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHADOW', 'LIGHT', 'OBJECT', 'TRACE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#dcd8e6', '#ccc8d8', '#e8e4f0', '#bab6c8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0812', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
