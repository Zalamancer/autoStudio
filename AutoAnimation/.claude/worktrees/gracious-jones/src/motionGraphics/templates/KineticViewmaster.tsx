import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ViewmasterConfig extends KineticBaseConfig {
  frameColor: string
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75
  return 7.5625 * t2 * t2 + 0.984375
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const size = Math.min(width, height)

    // Viewmaster binocular mask — two circular viewports
    const eyeRadius = size * 0.28
    const eyeSpacing = size * 0.15
    const centerY = height * 0.48

    // Reel disc rotation — the cardboard disc with 7 pairs of slides
    const discAngle = (time * 8) % 360

    // Slight stereoscopic depth shift between the two eye views
    const stereoShift = Math.sin(time * 0.8) * 1.5

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
        {/* Viewmaster body — dark bakelite housing */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: bgColor,
          }}
        />

        {/* Left eyepiece viewport */}
        <div
          style={{
            position: 'absolute',
            top: centerY,
            left: width * 0.5 - eyeSpacing - eyeRadius,
            width: eyeRadius * 2,
            height: eyeRadius * 2,
            borderRadius: '50%',
            transform: 'translateY(-50%)',
            background: 'radial-gradient(circle, rgba(255,248,235,0.06) 0%, rgba(255,240,220,0.02) 60%, transparent 100%)',
            border: '3px solid rgba(80,60,40,0.4)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
        >
          {/* Film frame border inside viewport */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '8%',
              right: '8%',
              bottom: '8%',
              border: '1px solid rgba(200,180,140,0.15)',
              borderRadius: 2,
            }}
          />
          {/* Kodachrome warm tint */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, rgba(255,200,100,0.04), rgba(200,150,80,0.02) 70%, transparent)',
            }}
          />
        </div>

        {/* Right eyepiece viewport */}
        <div
          style={{
            position: 'absolute',
            top: centerY,
            left: width * 0.5 + eyeSpacing - eyeRadius,
            width: eyeRadius * 2,
            height: eyeRadius * 2,
            borderRadius: '50%',
            transform: 'translateY(-50%)',
            background: 'radial-gradient(circle, rgba(255,248,235,0.06) 0%, rgba(255,240,220,0.02) 60%, transparent 100%)',
            border: '3px solid rgba(80,60,40,0.4)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '8%',
              right: '8%',
              bottom: '8%',
              border: '1px solid rgba(200,180,140,0.15)',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, rgba(255,200,100,0.04), rgba(200,150,80,0.02) 70%, transparent)',
            }}
          />
        </div>

        {/* Center bridge between eyepieces */}
        <div
          style={{
            position: 'absolute',
            top: centerY - size * 0.04,
            left: width * 0.5 - eyeSpacing * 0.5,
            width: eyeSpacing,
            height: size * 0.08,
            background: 'linear-gradient(180deg, rgba(60,45,30,0.5), rgba(40,30,20,0.6))',
            borderRadius: 2,
          }}
        />

        {/* Reel disc slots visible at top — the cardboard disc edge */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '50%',
            width: size * 0.5,
            height: size * 0.06,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, rgba(220,200,170,0.08), rgba(200,180,150,0.04))',
            borderRadius: '0 0 4px 4px',
            overflow: 'hidden',
          }}
        >
          {/* Disc notches — slide pair slots */}
          {Array.from({ length: 7 }, (_, i) => {
            const notchX = 8 + i * 13
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '20%',
                  left: `${notchX}%`,
                  width: '6%',
                  height: '60%',
                  background: `rgba(180,160,120,${0.06 + (i === 3 ? 0.08 : 0)})`,
                  borderRadius: 1,
                }}
              />
            )
          })}
        </div>

        {/* Lever advance indicator — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            right: '12%',
            width: size * 0.04,
            height: size * 0.15,
            background: 'linear-gradient(180deg, #888, #666, #777)',
            borderRadius: 3,
            transform: `rotate(${Math.sin(time * 0.5) * 3}deg)`,
            transformOrigin: 'top center',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.4)',
          }}
        />

        {/* Binocular vignette mask */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 48%, transparent 30%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.9) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Film grain overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px
            )`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame,
    width,
    height,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')

    if (phase === 'enter') {
      // Click-advance: disc rotates, slide drops into place with mechanical bounce
      // Characters appear with staggered stereoscopic convergence
      const elements = chars.map((ch, ci) => {
        const charDelay = ci / (chars.length + 2)
        const charP = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay + 0.01)))

        // Two-stage: 0-0.5 is disc rotating (blur + rotate), 0.5-1.0 is snap-in with bounce
        let charOpacity = 0
        let offsetY = 0
        let rotateZ = 0
        let blur = 0
        let stereoX = 0

        if (charP < 0.5) {
          // Disc rotating — character spinning in from above
          const rotT = charP / 0.5
          charOpacity = rotT * 0.6
          offsetY = (1 - rotT) * -50
          rotateZ = (1 - rotT) * 25
          blur = (1 - rotT) * 5
        } else {
          // Snap into stereoscopic focus with bounce
          const snapT = (charP - 0.5) / 0.5
          const bounced = easeOutBounce(snapT)
          charOpacity = 0.6 + bounced * 0.4
          offsetY = (1 - bounced) * -8
          rotateZ = 0
          blur = 0
          // Stereoscopic convergence — chars start with parallax offset then merge
          stereoX = (1 - bounced) * (pseudo(ci * 17 + index) * 6 - 3)
        }

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translate(${stereoX}px, ${offsetY}px) rotate(${rotateZ}deg)`,
              opacity: charOpacity,
              filter: blur > 0 ? `blur(${blur}px)` : undefined,
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(30px, 8vw, 100px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          {elements}
        </div>
      )
    }

    if (phase === 'hold') {
      // Stereoscopic depth float — characters drift with subtle 3D parallax
      const elements = chars.map((ch, ci) => {
        const depth = pseudo(ci * 23 + index * 11)
        // Gentle parallax oscillation per character
        const floatX = Math.sin(holdProgress * Math.PI * 3 + ci * 0.7) * (depth * 2)
        const floatY = Math.cos(holdProgress * Math.PI * 2.5 + ci * 1.1) * (depth * 1.5)
        // Soft Kodachrome color warmth pulse
        const warmth = 0.5 + Math.sin(holdProgress * Math.PI * 4 + ci) * 0.5
        const warmGlow = warmth > 0.7 ? (warmth - 0.7) * 3.3 : 0

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translate(${floatX}px, ${floatY}px)`,
              textShadow: warmGlow > 0
                ? `0 0 ${3 + warmGlow * 6}px rgba(255,200,120,${warmGlow * 0.25})`
                : '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(30px, 8vw, 100px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {elements}
        </div>
      )
    }

    // Exit: disc advances — characters rotate upward and out (mirrors enter in reverse)
    const elements = chars.map((ch, ci) => {
      const charDelay = (chars.length - 1 - ci) / (chars.length + 2)
      const charP = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay + 0.01)))
      const eased = easeInQuad(charP)

      const offsetY = eased * 50
      const rotateZ = eased * -20
      const charOpacity = Math.max(0, 1 - charP * 1.5)
      const blur = charP > 0.5 ? (charP - 0.5) * 8 : 0

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translate(0px, ${offsetY}px) rotate(${rotateZ}deg)`,
            opacity: charOpacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Georgia', 'Palatino', serif",
          fontSize: 'clamp(30px, 8vw, 100px)',
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}
      >
        {elements}
      </div>
    )
  },
}

function ViewmasterComponent(props: MotionGraphicProps<ViewmasterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-viewmaster',
  title: 'Kinetic Viewmaster',
  description:
    'View-Master stereoscopic reel viewer with binocular eyepiece mask, Kodachrome warm tint, and reel disc advance. Characters click into place with mechanical bounce and stereoscopic convergence, float with parallax depth during hold, then rotate out as the disc advances.',
  tags: ['kinetic', 'typography', 'viewmaster', 'stereoscope', '3d', 'vintage', 'slides', 'kodachrome', 'toy'],
  category: 'captions',
  component: ViewmasterComponent as any,
  defaultConfig: {
    words: ['EXPLORE', 'WONDER', 'SCENIC', 'VIEWS'],
    colors: ['#FFF8E8', '#F5E6CA', '#FFEEDD', '#FFF0D8'],
    bgColor: '#1A0E08',
    cycleDuration: 1.4,
    frameColor: '#C8A878',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EXPLORE', 'WONDER', 'SCENIC', 'VIEWS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFF8E8', '#F5E6CA', '#FFEEDD', '#FFF0D8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0E08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
