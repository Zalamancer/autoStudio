import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaperTearRevealConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Generate a jagged torn-paper edge path as CSS polygon points
function tornEdge(seed: number, vertical: boolean, position: number, count: number): string {
  const points: string[] = []
  for (let i = 0; i <= count; i++) {
    const t = i / count
    const jag = (rand(seed + i * 7.3) - 0.5) * 3
    if (vertical) {
      points.push(`${position + jag}% ${t * 100}%`)
    } else {
      points.push(`${t * 100}% ${position + jag}%`)
    }
  }
  return points.join(', ')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Cork board / warm brown backdrop */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(180,140,80,0.06), transparent 30%),
              radial-gradient(circle at 70% 60%, rgba(160,120,60,0.05), transparent 25%),
              radial-gradient(circle at 45% 80%, rgba(170,130,70,0.04), transparent 20%)
            `,
          }}
        />
        {/* Cork texture dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(140,100,50,0.08) 1px, transparent 1px)`,
            backgroundSize: '12px 12px',
            mixBlendMode: 'multiply' as const,
          }}
        />
        {/* Scattered small torn paper scraps in background */}
        {Array.from({ length: 4 }, (_, i) => {
          const sx = 10 + rand(i * 43 + 3) * 80
          const sy = 10 + rand(i * 67 + 11) * 80
          const sw = 30 + rand(i * 31) * 40
          const sh = 15 + rand(i * 23) * 20
          const rot = (rand(i * 53) - 0.5) * 30
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${sx}%`,
                top: `${sy}%`,
                width: sw,
                height: sh,
                background: ['#F5F0E6', '#EFE8D8', '#F0E6D6', '#E8E0D0'][i],
                transform: `rotate(${rot}deg)`,
                borderRadius: '1px',
                boxShadow: '1px 1px 3px rgba(0,0,0,0.08)',
                opacity: 0.4,
              }}
            />
          )
        })}
        {/* Push pin decorative element */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #E8504A, #C03030)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.2)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // The paper tear happens in center, splitting horizontally
    // Left half tears left, right half tears right, revealing text behind
    const tearSeed = index * 47 + 13
    const edgePointCount = 20

    let tearAmount = 0
    let textOpacity = 0
    let textScale = 1
    let tearShadow = 0
    let paperOpacity = 1

    if (phase === 'enter') {
      // Paper tears apart revealing text
      const ep = easeOutQuart(enterProgress)
      tearAmount = ep
      textOpacity = Math.max(0, (enterProgress - 0.2) / 0.6)
      textScale = 0.95 + Math.min(1, enterProgress * 1.3) * 0.05
      tearShadow = ep * 8
      paperOpacity = 1
    } else if (phase === 'hold') {
      tearAmount = 1
      textOpacity = 1
      textScale = 1 + Math.sin(t * 1.5) * 0.01
      tearShadow = 8
      paperOpacity = 1
      // Slight paper flutter
    } else {
      // Paper closes back together hiding text
      const ep = easeInQuart(exitProgress)
      tearAmount = 1 - ep
      textOpacity = 1 - ep * 1.3
      textScale = 1 - ep * 0.05
      tearShadow = (1 - ep) * 8
      paperOpacity = 1
    }

    const tearGap = tearAmount * 52 // max 52% each side from center

    // Build torn edge polygon for left paper
    const leftEdgePoints = tornEdge(tearSeed, true, 100, edgePointCount)
    const leftClip = `polygon(0% 0%, ${leftEdgePoints}, 0% 100%)`

    // Build torn edge polygon for right paper (mirror)
    const rightEdgePoints = tornEdge(tearSeed + 100, true, 0, edgePointCount)
    const rightClip = `polygon(${rightEdgePoints}, 100% 0%, 100% 100%)`

    // Paper color — light cream/off-white
    const paperColor = '#F2EDE3'
    const paperColorDarker = '#E8E0D2'

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Text underneath the paper */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            opacity: textOpacity,
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              textTransform: 'uppercase',
              textShadow: `0 2px 8px ${color}30`,
              mixBlendMode: 'multiply' as const,
            }}
          >
            {word.split('').map((ch, ci) => {
              const charDelay = (ci / (word.length + 1)) * 0.3
              const charP = phase === 'enter'
                ? Math.max(0, Math.min(1, (enterProgress - 0.15 - charDelay) / 0.5))
                : phase === 'hold' ? 1
                : Math.max(0, 1 - (exitProgress - charDelay * 0.5) / 0.6)

              return (
                <span
                  key={ci}
                  style={{
                    display: 'inline-block',
                    opacity: charP,
                    transform: `translateY(${(1 - charP) * 8}px)`,
                  }}
                >
                  {ch}
                </span>
              )
            })}
          </div>
        </div>

        {/* Left paper half */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            transform: `translateX(${-tearGap}%)`,
            clipPath: leftClip,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, ${paperColor} 0%, ${paperColor} 85%, ${paperColorDarker} 100%)`,
              boxShadow: tearAmount > 0.1 ? `${tearShadow}px 0 ${tearShadow * 2}px rgba(0,0,0,0.1)` : 'none',
            }}
          >
            {/* Paper fiber texture */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                  repeating-linear-gradient(88deg, transparent 0px, transparent 50px, rgba(180,160,130,0.03) 50px, rgba(180,160,130,0.03) 51px)
                `,
                mixBlendMode: 'multiply' as const,
              }}
            />
            {/* Torn edge fiber fringe — visible on right edge */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: -2,
                width: 4,
                backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(200,180,150,0.3) 2px, rgba(200,180,150,0.3) 3px)`,
              }}
            />
          </div>
        </div>

        {/* Right paper half */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            transform: `translateX(${tearGap}%)`,
            clipPath: rightClip,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, ${paperColorDarker} 0%, ${paperColor} 15%, ${paperColor} 100%)`,
              boxShadow: tearAmount > 0.1 ? `${-tearShadow}px 0 ${tearShadow * 2}px rgba(0,0,0,0.1)` : 'none',
            }}
          >
            {/* Paper fiber texture */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                  repeating-linear-gradient(92deg, transparent 0px, transparent 45px, rgba(180,160,130,0.03) 45px, rgba(180,160,130,0.03) 46px)
                `,
                mixBlendMode: 'multiply' as const,
              }}
            />
            {/* Torn edge fiber fringe — visible on left edge */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: -2,
                width: 4,
                backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(200,180,150,0.3) 2px, rgba(200,180,150,0.3) 3px)`,
              }}
            />
          </div>
        </div>

        {/* Torn fiber wisps floating out during tear */}
        {tearAmount > 0.2 && tearAmount < 0.95 && Array.from({ length: 6 }, (_, i) => {
          const fiberX = 50 + (rand(tearSeed + i * 19) - 0.5) * 10
          const fiberY = 20 + rand(tearSeed + i * 29) * 60
          const fiberLen = 6 + rand(tearSeed + i * 37) * 10
          const fiberRot = (rand(tearSeed + i * 43) - 0.5) * 60
          const fiberDrift = Math.sin(t * 2 + i) * 3
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${fiberX}%`,
                top: `${fiberY}%`,
                width: fiberLen,
                height: 1,
                background: 'rgba(200,185,160,0.4)',
                transform: `rotate(${fiberRot}deg) translateY(${fiberDrift}px)`,
                zIndex: 3,
                pointerEvents: 'none',
              }}
            />
          )
        })}
      </div>
    )
  },
}

function PaperTearRevealComponent(props: MotionGraphicProps<PaperTearRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paper-tear-reveal',
  title: 'Kinetic Paper Tear Reveal',
  description:
    'Paper tears apart from center with jagged torn edges and floating fiber wisps, revealing bold text underneath. Cork board backdrop with push pin, paper closes back on exit.',
  tags: ['kinetic', 'typography', 'paper', 'tear', 'reveal', 'handmade', 'warm', 'organic', 'craft'],
  category: 'captions',
  component: PaperTearRevealComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'OPEN', 'PEEK', 'FIND'],
    colors: ['#C0392B', '#2C3E50', '#27AE60', '#8E44AD'],
    bgColor: '#B89E78',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVEAL', 'OPEN', 'PEEK', 'FIND'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#C0392B', '#2C3E50', '#27AE60', '#8E44AD'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#B89E78', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
