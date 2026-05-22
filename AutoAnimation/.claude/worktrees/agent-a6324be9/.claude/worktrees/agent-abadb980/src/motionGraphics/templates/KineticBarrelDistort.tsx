import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BarrelDistortConfig extends KineticBaseConfig {
  distortAmount: number
}

// Fisheye/barrel lens distortion — simulated via SVG filter + CSS perspective skew.
// Text enters heavily barrel-distorted (wide-angle fisheye) and flattens to normal.

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Corner darkening — heavy vignette typical of ultra-wide lenses */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.75) 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* Horizontal grid lines — useful reference for distortion */}
      {[20, 40, 60, 80].map(y => (
        <div
          key={y}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${y}%`,
            height: 1,
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />
      ))}
      {[20, 40, 60, 80].map(x => (
        <div
          key={x}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${x}%`,
            width: 1,
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const easeIn  = (t: number) => Math.pow(t, 3)

    let distort: number   // 0 = flat, 1 = max barrel
    let opacity: number
    let scaleX: number    // fisheye squishes x at edges → we exaggerate centre scale
    let scaleY: number
    let perspX: number    // CSS perspective skew for pseudo-barrel

    if (phase === 'enter') {
      const ep = easeOut(enterProgress)
      distort = 1 - ep
      opacity = 0.4 + ep * 0.6
      scaleX = 1 + distort * 0.4   // wide-angle appears wider
      scaleY = 1 - distort * 0.08  // slight vertical compression
      perspX = distort * 0          // no lateral shift needed
    } else if (phase === 'hold') {
      distort = 0
      opacity = 1
      scaleX = 1
      scaleY = 1
      perspX = 0
    } else {
      const ep = easeIn(exitProgress)
      distort = ep
      opacity = 1 - ep * 0.8
      scaleX = 1 + distort * 0.4
      scaleY = 1 - distort * 0.08
      perspX = 0
    }

    // Letter spacing simulates the barrel stretching of characters toward edges
    const letterSpacing = 0.04 + distort * 0.18

    // SVG filter id — unique per word index to avoid collisions
    const filterId = `barrel-${index}`

    // Barrel distortion approximated with SVG feTurbulence + feDisplacementMap
    // We use a deterministic static turbulence with scale driven by distort
    const dispScale = distort * 60

    return (
      <>
        {/* SVG filter definition */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
              {/* Radial displacement — pushes pixels outward from centre = barrel effect */}
              <feImage
                result="radialMask"
                href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmFkaWFsR3JhZGllbnQgaWQ9ImciPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iZ3JheSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0id2hpdGUiLz48L3JhZGlhbEdyYWRpZW50PjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="radialMask"
                scale={dispScale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`,
            whiteSpace: 'nowrap',
            filter: distort > 0.02 ? `url(#${filterId})` : 'none',
            opacity,
          }}
        >
          {/* Chromatic fringing at edge of barrel lens */}
          {distort > 0.05 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scaleX(${1 + distort * 0.015})`,
                fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                fontSize: 'clamp(40px, 10vw, 140px)',
                fontWeight: 300,
                color: `rgba(255,80,0,${distort * 0.4})`,
                letterSpacing: `${letterSpacing + 0.02}em`,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                mixBlendMode: 'screen',
              }}
            >
              {word}
            </div>
          )}
          {/* Main text */}
          <div
            style={{
              position: 'relative',
              fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 300,
              color,
              letterSpacing: `${letterSpacing}em`,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              textShadow: distort < 0.05 ? `0 2px 20px rgba(255,255,255,0.1)` : 'none',
            }}
          >
            {word}
          </div>
        </div>
      </>
    )
  },
}

function BarrelDistortComponent(props: MotionGraphicProps<BarrelDistortConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-barrel-distort',
  title: 'Kinetic Barrel Distort',
  description: 'Fisheye/barrel lens distortion: text enters heavily distorted like a wide-angle lens, then flattens to normal as if switching to a longer focal length',
  tags: ['kinetic', 'typography', 'film', 'camera', 'barrel', 'fisheye', 'lens', 'distortion', 'cinematic'],
  category: 'captions',
  component: BarrelDistortComponent as any,
  defaultConfig: {
    words: ['WIDE', 'ANGLE', 'LENS', 'SHOT'],
    colors: ['#FFFFFF', '#E0F0FF', '#C8E4FF', '#F0FAFF'],
    bgColor: '#080C10',
    cycleDuration: 1.3,
    distortAmount: 60,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WIDE', 'ANGLE', 'LENS', 'SHOT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#E0F0FF', '#C8E4FF', '#F0FAFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080C10', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
    { key: 'distortAmount', label: 'Distortion Amount', type: 'number', defaultValue: 60, min: 10, max: 120, group: 'Animation' },
  ],
})
