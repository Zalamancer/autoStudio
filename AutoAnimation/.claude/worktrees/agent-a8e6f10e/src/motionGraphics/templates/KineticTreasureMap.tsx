import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TreasureMapConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Parchment texture with aged edges
    const edgeBurn = 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(80, 50, 20, 0.3) 80%, rgba(40, 20, 5, 0.6) 100%)'

    // Dotted path points forming a winding treasure trail
    const pathPoints: { x: number; y: number }[] = []
    const segments = 20
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const x = width * 0.15 + t * width * 0.7 + Math.sin(t * Math.PI * 3) * width * 0.08
      const y = height * 0.7 - t * height * 0.4 + Math.cos(t * Math.PI * 2.5) * height * 0.06
      pathPoints.push({ x, y })
    }

    // Animate how much of the path is drawn
    const pathProgress = Math.min(1, (time % 8) / 5)
    const visiblePoints = Math.floor(pathProgress * pathPoints.length)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Base parchment */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #d4b483 0%, #c9a86c 30%, #d4b070 60%, #c4a265 100%)',
        }} />
        {/* Aged texture overlay */}
        <div style={{ position: 'absolute', inset: 0, background: edgeBurn }} />
        {/* Paper grain */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.08,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(80,50,20,0.3) 2px, transparent 4px),
            repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(80,50,20,0.2) 3px, transparent 6px)`,
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Compass rose top-right */}
          <g transform={`translate(${width - 60}, 55)`}>
            {/* Outer ring */}
            <circle cx={0} cy={0} r={28} fill="none" stroke="rgba(100, 60, 20, 0.3)" strokeWidth={1} />
            <circle cx={0} cy={0} r={22} fill="none" stroke="rgba(100, 60, 20, 0.2)" strokeWidth={0.5} />
            {/* Cardinal points */}
            <polygon points="0,-24 -4,-6 4,-6" fill="rgba(140, 60, 20, 0.5)" />
            <polygon points="0,24 -4,6 4,6" fill="rgba(100, 60, 20, 0.25)" />
            <polygon points="-24,0 -6,-4 -6,4" fill="rgba(100, 60, 20, 0.25)" />
            <polygon points="24,0 6,-4 6,4" fill="rgba(100, 60, 20, 0.25)" />
            {/* Ordinal points */}
            <polygon points="-17,-17 -3,-7 -7,-3" fill="rgba(100, 60, 20, 0.15)" />
            <polygon points="17,-17 3,-7 7,-3" fill="rgba(100, 60, 20, 0.15)" />
            <polygon points="-17,17 -3,7 -7,3" fill="rgba(100, 60, 20, 0.15)" />
            <polygon points="17,17 3,7 7,3" fill="rgba(100, 60, 20, 0.15)" />
            <text x={0} y={-30} textAnchor="middle" fill="rgba(120, 60, 20, 0.5)" fontSize={8} fontFamily="serif">N</text>
            <text x={0} y={37} textAnchor="middle" fill="rgba(120, 60, 20, 0.3)" fontSize={7} fontFamily="serif">S</text>
            <text x={-33} y={3} textAnchor="middle" fill="rgba(120, 60, 20, 0.3)" fontSize={7} fontFamily="serif">W</text>
            <text x={33} y={3} textAnchor="middle" fill="rgba(120, 60, 20, 0.3)" fontSize={7} fontFamily="serif">E</text>
          </g>
          {/* Dotted trail path */}
          {pathPoints.slice(0, visiblePoints).map((p, i) => (
            <circle key={`dot${i}`} cx={p.x} cy={p.y} r={1.8}
              fill="rgba(100, 50, 15, 0.4)"
              opacity={0.3 + (i / pathPoints.length) * 0.5} />
          ))}
          {/* X marks the spot at end of path */}
          {visiblePoints >= pathPoints.length && (
            <g transform={`translate(${pathPoints[pathPoints.length - 1].x}, ${pathPoints[pathPoints.length - 1].y})`}>
              <line x1={-8} y1={-8} x2={8} y2={8} stroke="rgba(180, 40, 20, 0.6)" strokeWidth={2.5} />
              <line x1={8} y1={-8} x2={-8} y2={8} stroke="rgba(180, 40, 20, 0.6)" strokeWidth={2.5} />
            </g>
          )}
          {/* Small landmark sketches */}
          {/* Palm tree */}
          <g transform={`translate(${width * 0.2}, ${height * 0.75})`} opacity={0.2}>
            <line x1={0} y1={0} x2={0} y2={-15} stroke="rgb(100,60,20)" strokeWidth={1.5} />
            <path d="M0,-15 Q-8,-20 -12,-15 M0,-15 Q8,-20 12,-15 M0,-15 Q-5,-22 -10,-18 M0,-15 Q5,-22 10,-18"
              fill="none" stroke="rgb(100,60,20)" strokeWidth={0.8} />
          </g>
          {/* Mountain sketch */}
          <g transform={`translate(${width * 0.6}, ${height * 0.35})`} opacity={0.15}>
            <path d="M-15,10 L0,-8 L15,10 M-8,10 L-3,-2 L5,10"
              fill="none" stroke="rgb(100,60,20)" strokeWidth={0.8} />
          </g>
          {/* Wavy water lines */}
          <g opacity={0.12}>
            <path d={`M${width * 0.05},${height * 0.55} Q${width * 0.1},${height * 0.53} ${width * 0.15},${height * 0.55}`}
              fill="none" stroke="rgb(60,80,120)" strokeWidth={0.6} />
            <path d={`M${width * 0.06},${height * 0.57} Q${width * 0.11},${height * 0.55} ${width * 0.16},${height * 0.57}`}
              fill="none" stroke="rgb(60,80,120)" strokeWidth={0.6} />
          </g>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.55), 120)

    if (phase === 'enter') {
      // Parchment unrolls — text revealed with calligraphic stroke
      const t = enterProgress
      const ease = 1 - Math.pow(1 - t, 3)
      // Clip from left to right like unrolling
      const clipX = ease * 110

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Unroll shadow edge */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: `${clipX * 0.85}%`,
            width: 12,
            height: fontSize * 2,
            transform: 'translateY(-50%)',
            background: `linear-gradient(90deg, rgba(80,50,20,0.15), transparent)`,
            opacity: ease < 0.95 ? 1 : 0,
          }} />
          {/* Text revealed left-to-right */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            clipPath: `inset(0 ${100 - clipX}% 0 0)`,
            fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            fontStyle: 'italic',
            color,
            letterSpacing: 6,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            textShadow: '1px 1px 0 rgba(80,50,20,0.15)',
          }}>
            {word}
          </div>
          {/* Calligraphic underline stroke */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.45}px)`,
            left: '50%',
            transform: `translateX(-50%) scaleX(${ease})`,
            transformOrigin: 'left center',
            width: word.length * fontSize * 0.55,
            height: 2,
            background: `linear-gradient(90deg, ${color}60, ${color}30, transparent)`,
          }} />
        </div>
      )
    } else if (phase === 'hold') {
      const wobble = Math.sin(holdProgress * Math.PI * 6) * 0.3

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${wobble}deg)`,
            fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            fontStyle: 'italic',
            color,
            letterSpacing: 6,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            textShadow: '1px 1px 0 rgba(80,50,20,0.15)',
          }}>
            {word}
          </div>
          {/* Decorative underline */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.45}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: word.length * fontSize * 0.55,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
          }} />
          {/* Small X mark accent below */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.7}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'serif',
            fontSize: 14,
            color: 'rgba(180, 40, 20, 0.4)',
          }}>
            &#10006;
          </div>
        </div>
      )
    } else {
      // Exit: scroll up like parchment rolling back
      const t = exitProgress
      const ease = t * t
      const clipY = ease * 110

      return (
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 1 - ease,
          clipPath: `inset(${clipY}% 0 0 0)`,
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            fontStyle: 'italic',
            color,
            letterSpacing: 6,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            textShadow: '1px 1px 0 rgba(80,50,20,0.15)',
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function TreasureMapComponent(props: MotionGraphicProps<TreasureMapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-treasure-map',
  title: 'Treasure Map',
  description: 'Parchment treasure map unrolls to reveal hand-drawn calligraphic text with dotted trail path, compass rose, X-marks-the-spot, and aged sepia paper texture',
  tags: ['kinetic', 'typography', 'treasure', 'map', 'parchment', 'pirate', 'calligraphy', 'vintage'],
  category: 'captions',
  component: TreasureMapComponent as any,
  defaultConfig: {
    words: ['VOYAGE', 'ISLAND', 'BOUNTY', 'LEGEND'],
    colors: ['#5a3010', '#6b3a15', '#5a3010', '#8b2010'],
    bgColor: '#c9a86c',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VOYAGE', 'ISLAND', 'BOUNTY', 'LEGEND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5a3010', '#6b3a15', '#5a3010', '#8b2010'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#c9a86c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
