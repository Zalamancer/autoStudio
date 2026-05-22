import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TapestryWeaveConfig extends KineticBaseConfig {
  threadDensity: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Ease-out back — weft thread snaps into place on the loom */
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/** Ease-in elastic — thread being pulled taut before release */
function easeInElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3))
}

/** Ease-in-out sine — shuttle's smooth back-and-forth */
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const warpCount = Math.floor(width / 6)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Warp threads — vertical tension threads on the loom */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {Array.from({ length: warpCount }, (_, i) => {
            const x = (i / warpCount) * width
            const sway = Math.sin(time * 1.2 + i * 0.3) * 0.4
            const threadColor = rand(i * 17) > 0.5
              ? `rgba(180,160,130,${0.06 + rand(i * 31) * 0.03})`
              : `rgba(160,140,110,${0.05 + rand(i * 23) * 0.03})`
            return (
              <line
                key={i}
                x1={x + sway}
                y1={0}
                x2={x - sway}
                y2={height}
                stroke={threadColor}
                strokeWidth={0.8 + rand(i * 7) * 0.4}
              />
            )
          })}
        </svg>
        {/* Loom frame edges — dark wood borders */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: 'linear-gradient(180deg, rgba(60,40,20,0.4) 0%, rgba(60,40,20,0.1) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 5,
            background: 'linear-gradient(0deg, rgba(60,40,20,0.4) 0%, rgba(60,40,20,0.1) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Woven background texture — subtle horizontal weft pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 5px,
              rgba(140,120,90,0.03) 5px,
              rgba(140,120,90,0.03) 6px
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
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0
    const rowCount = 12 // Horizontal weave rows that build each character

    // Shuttle position — the flying shuttle carrying weft thread
    const shuttleRow = phase === 'enter'
      ? Math.floor(easeInOutSine(enterProgress) * rowCount)
      : phase === 'exit'
        ? rowCount - 1 - Math.floor(easeInOutSine(exitProgress) * rowCount)
        : -1
    const shuttleDirection = shuttleRow % 2 === 0 ? 1 : -1 // Alternates L-R, R-L
    const shuttleVisible = phase === 'enter' && enterProgress > 0.03 && enterProgress < 0.92

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Flying shuttle */}
        {shuttleVisible && (
          <div
            style={{
              position: 'absolute',
              left: shuttleDirection > 0
                ? `${easeInOutSine((enterProgress * rowCount) % 1) * 70 + 10}%`
                : `${90 - easeInOutSine((enterProgress * rowCount) % 1) * 70}%`,
              top: `${30 + (shuttleRow / rowCount) * 40}%`,
              transform: `translateX(-50%) scaleX(${shuttleDirection})`,
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            {/* Shuttle body — tapered wooden boat shape */}
            <div
              style={{
                width: 28,
                height: 8,
                background: 'linear-gradient(180deg, #8B6914 0%, #6B4F3A 100%)',
                borderRadius: '4px 12px 12px 4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                position: 'relative',
              }}
            >
              {/* Thread trailing from shuttle */}
              <div
                style={{
                  position: 'absolute',
                  left: -12,
                  top: 3,
                  width: 12,
                  height: 1.5,
                  background: `${color}80`,
                  borderRadius: 1,
                }}
              />
            </div>
          </div>
        )}

        {/* Character rendering — woven row by row */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {chars.map((ch, ci) => {
            const charDelay = (ci / (totalChars + 1)) * 0.4
            let weaveProgress = 0
            let threadOpacity = 0
            let sway = 0

            if (phase === 'enter') {
              // Each character weaves from top-to-bottom in staggered rows
              const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.4)))
              weaveProgress = easeOutBack(Math.min(1, p))
              threadOpacity = p > 0 ? Math.min(1, p * 2) : 0
            } else if (phase === 'hold') {
              weaveProgress = 1
              threadOpacity = 1
              // Tapestry hangs on wall — gentle fabric sway
              sway = Math.sin(holdProgress * Math.PI * 3 + ci * 0.8) * 1.2
            } else {
              // Exit: unweaving — weft threads pull back out row by row
              const p = Math.max(0, Math.min(1, (exitProgress - (1 - ci / totalChars) * 0.3) / 0.7))
              weaveProgress = 1 - easeInElastic(Math.min(1, p))
              threadOpacity = 1 - p
            }

            // Clip from top based on weave progress — reveals row by row
            const clipBottom = (1 - weaveProgress) * 100

            return (
              <div
                key={ci}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                {/* Layer 1: Weft color fill — the woven colored thread */}
                <span
                  style={{
                    fontFamily: "'Georgia', 'Palatino Linotype', serif",
                    fontSize: 'clamp(44px, 11vw, 145px)',
                    fontWeight: 700,
                    color,
                    display: 'inline-block',
                    opacity: threadOpacity,
                    clipPath: `inset(0 0 ${clipBottom}% 0)`,
                    transform: `translateY(${sway}px)`,
                    letterSpacing: '0.03em',
                    pointerEvents: 'none',
                  }}
                >
                  {ch}
                </span>
                {/* Layer 2: Warp overlay — vertical thread texture over text */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    opacity: threadOpacity * 0.25,
                    clipPath: `inset(0 0 ${clipBottom}% 0)`,
                    transform: `translateY(${sway}px)`,
                    mixBlendMode: 'overlay',
                  }}
                >
                  {Array.from({ length: 6 }, (_, ti) => {
                    const tx = 15 + ti * 14 + (rand(ci * 53 + ti * 7) - 0.5) * 4
                    const warpSway = phase === 'hold'
                      ? Math.sin(holdProgress * Math.PI * 2 + ti * 0.6) * 0.5
                      : 0
                    return (
                      <div
                        key={ti}
                        style={{
                          position: 'absolute',
                          left: `${tx}%`,
                          top: 0,
                          width: 1.5,
                          height: '100%',
                          background: `rgba(180,160,130,${0.3 + rand(ci * 31 + ti * 19) * 0.3})`,
                          transform: `translateX(${warpSway}px)`,
                        }}
                      />
                    )
                  })}
                </div>
                {/* Layer 3: Weft row lines — horizontal thread rows across the character */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    opacity: threadOpacity * 0.15,
                    clipPath: `inset(0 0 ${clipBottom}% 0)`,
                    transform: `translateY(${sway}px)`,
                  }}
                >
                  {Array.from({ length: rowCount }, (_, ri) => {
                    const ry = (ri / rowCount) * 100 + 4
                    const rowBuilt = weaveProgress > ri / rowCount
                    if (!rowBuilt) return null
                    const rowColor = rand(ci * 41 + ri * 29) > 0.6
                      ? color
                      : `rgba(180,160,130,0.4)`
                    return (
                      <div
                        key={ri}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: `${ry}%`,
                          height: 1.5,
                          background: rowColor,
                          opacity: 0.5,
                        }}
                      />
                    )
                  })}
                </div>
                {/* Loose thread ends at edges during weaving */}
                {weaveProgress > 0.3 && weaveProgress < 0.95 &&
                  Array.from({ length: 2 }, (_, li) => {
                    const threadY = weaveProgress * 80 + 10 + li * 5
                    const side = li === 0 ? -6 : 'calc(100% + 2px)'
                    const threadLen = 3 + rand(ci * 67 + li * 41) * 8
                    const threadDroop = Math.sin(f * 0.1 + ci + li) * 2
                    return (
                      <div
                        key={li}
                        style={{
                          position: 'absolute',
                          left: typeof side === 'number' ? side : undefined,
                          right: typeof side === 'string' ? 0 : undefined,
                          top: `${threadY}%`,
                          width: threadLen,
                          height: 1,
                          background: `${color}50`,
                          transform: `rotate(${threadDroop + (li === 0 ? -15 : 15)}deg)`,
                          transformOrigin: li === 0 ? '100% 50%' : '0% 50%',
                          borderRadius: 1,
                          pointerEvents: 'none',
                          opacity: threadOpacity * 0.6,
                        }}
                      />
                    )
                  })}
              </div>
            )
          })}
        </div>

        {/* Loom annotation */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              bottom: '14%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Georgia', serif",
              fontSize: 7,
              color: 'rgba(140,120,90,0.2)',
              letterSpacing: 2,
              fontStyle: 'italic',
            }}
          >
            warp & weft — plain weave
          </div>
        )}
      </div>
    )
  },
}

function TapestryWeaveComponent(props: MotionGraphicProps<TapestryWeaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tapestry-weave',
  title: 'Kinetic Tapestry Weave',
  description:
    'Flying shuttle carries weft threads across loom warp to build text row-by-row — vertical warp overlay, loose thread ends, and gentle hanging sway',
  tags: ['kinetic', 'typography', 'tapestry', 'weave', 'loom', 'textile', 'fabric', 'warp', 'weft', 'craft'],
  category: 'captions',
  component: TapestryWeaveComponent as any,
  defaultConfig: {
    words: ['WEAVE', 'LOOM', 'WARP', 'WEFT'],
    colors: ['#B8860B', '#8B4513', '#A0522D', '#CD853F'],
    bgColor: '#2A2218',
    cycleDuration: 1.5,
    threadDensity: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WEAVE', 'LOOM', 'WARP', 'WEFT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#B8860B', '#8B4513', '#A0522D', '#CD853F'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2A2218', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'threadDensity',
      label: 'Thread Density',
      type: 'number',
      defaultValue: 1,
      min: 0.5,
      max: 2,
      group: 'Animation',
    },
  ],
})
