import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MidjourneyPromptConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function pRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const PARAMS = ['--ar 9:16', '--v 6.1', '--style raw', '--quality 2', '--stylize 750']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Midjourney Discord-style dark background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(88,101,242,0.08) 0%, rgba(88,101,242,0.03) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Bot message header */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(8px, 1.8vw, 14px)',
            left: 'clamp(10px, 2.5vw, 20px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(5px, 1vw, 8px)',
          }}
        >
          <div
            style={{
              width: 'clamp(16px, 3vw, 24px)',
              height: 'clamp(16px, 3vw, 24px)',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #5865F2, #3A4AE0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(6px, 1.1vw, 9px)',
              fontWeight: 900,
              color: '#fff',
            }}
          >
            MJ
          </div>
          <span
            style={{
              fontFamily: '"Whitney", system-ui, sans-serif',
              fontSize: 'clamp(8px, 1.5vw, 12px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            Midjourney Bot
          </span>
          <span
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(5px, 0.9vw, 7px)',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            Today at 3:42 PM
          </span>
        </div>

        {/* 4-grid image placeholder */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(30px, 6.5vw, 52px)',
            left: 'clamp(30px, 6.5vw, 52px)',
            width: 'clamp(70px, 18vw, 130px)',
            height: 'clamp(70px, 18vw, 130px)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: 4 }, (_, i) => {
            const shimmer = 0.05 + pRand(i * 17 + 99) * 0.12 + Math.sin(time * 2 + i) * 0.04
            return (
              <div
                key={i}
                style={{
                  background: `rgba(${Math.floor(pRand(i * 33) * 60 + 30)},${Math.floor(pRand(i * 47) * 40 + 20)},${Math.floor(pRand(i * 61) * 80 + 40)},${0.8 + shimmer})`,
                }}
              />
            )
          })}
        </div>

        {/* Progress bar when generating */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(8px, 1.8vw, 14px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(100px, 36vw, 240px)',
          }}
        >
          <div
            style={{
              height: 'clamp(3px, 0.6vw, 5px)',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 100,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${((time * 0.1) % 1) * 100}%`,
                background: 'linear-gradient(90deg, #5865F2, #EB459E)',
                borderRadius: 100,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(5px, 0.9vw, 7px)',
              color: 'rgba(255,255,255,0.3)',
              marginTop: 3,
              textAlign: 'center',
            }}
          >
            Generating variations...
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // /imagine prompt types in
    const promptP = Math.min(1, enterProgress / 0.5)
    const fullPrompt = `/imagine ${word.toLowerCase()} cinematic masterpiece, ultra detailed, 8k`
    const charsToShow = Math.floor(promptP * fullPrompt.length)
    const displayPrompt = fullPrompt.substring(0, charsToShow)
    const promptOpacity = Math.min(1, enterProgress * 4) * (phase === 'exit' ? Math.max(0, 1 - exitProgress * 3) : 1)

    // Params appear staggered
    const paramsOpacity = Math.min(1, Math.max(0, (enterProgress - 0.3) * 5)) * (phase === 'exit' ? Math.max(0, 1 - exitProgress * 3) : 1)

    // Word bursts like the final image revealed
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.55) / 0.45)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.5) * 5))
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.07) * 0.014 : 1

    // Cursor blink
    const showCursor = phase === 'enter' && enterProgress < 0.55 && Math.sin(f * 0.28) > 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* /imagine prompt */}
        <div
          style={{
            position: 'absolute',
            top: '52%',
            left: 'clamp(10px, 2.5vw, 20px)',
            right: 'clamp(10px, 2.5vw, 20px)',
            fontFamily: '"SF Mono", "Fira Code", monospace',
            fontSize: 'clamp(8px, 1.5vw, 12px)',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.5,
            opacity: promptOpacity * (phase === 'enter' && enterProgress > 0.5 ? Math.max(0.1, 1 - (enterProgress - 0.5) * 4) : 1),
          }}
        >
          <span style={{ color: '#5865F2', fontWeight: 700 }}>/imagine</span>{' '}
          <span>{word.toLowerCase()}</span>{' '}
          {enterProgress > 0.2 && (
            <span style={{ color: '#EB459E' }}>
              cinematic masterpiece
            </span>
          )}
          {enterProgress > 0.3 && (
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>, ultra detailed, 8k</span>
          )}
          {showCursor && (
            <span
              style={{
                display: 'inline-block',
                width: 'clamp(1.5px, 0.3vw, 2px)',
                height: 'clamp(10px, 1.8vw, 14px)',
                background: '#5865F2',
                marginLeft: 1,
                verticalAlign: 'middle',
              }}
            />
          )}
        </div>

        {/* Params row */}
        <div
          style={{
            position: 'absolute',
            top: '63%',
            left: 'clamp(10px, 2.5vw, 20px)',
            display: 'flex',
            gap: 4,
            flexWrap: 'wrap',
            opacity: paramsOpacity * (phase === 'enter' && enterProgress > 0.5 ? Math.max(0, 1 - (enterProgress - 0.5) * 5) : 1),
          }}
        >
          {PARAMS.map((p, i) => (
            <span
              key={i}
              style={{
                fontFamily: '"SF Mono", "Fira Code", monospace',
                fontSize: 'clamp(5px, 0.9vw, 7px)',
                color: '#57F287',
                background: 'rgba(87,242,135,0.1)',
                padding: '1px 5px',
                borderRadius: 4,
                border: '1px solid rgba(87,242,135,0.2)',
              }}
            >
              {p}
            </span>
          ))}
        </div>

        {/* Main word — the generated image title */}
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '50%',
            transform: `translateX(-50%) scale(${wordP * pulse})`,
            opacity: wordOpacity,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(34px, 8.5vw, 118px)',
              fontWeight: 900,
              color,
              textShadow: `0 0 30px ${color}55, 0 0 60px ${color}22`,
              letterSpacing: -2,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function MidjourneyPromptComponent(props: MotionGraphicProps<MidjourneyPromptConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-midjourney-prompt',
  title: 'Kinetic Midjourney Prompt',
  description:
    'Midjourney /imagine prompt types out with syntax coloring — Discord bot interface, 4-grid image tiles generate, params appear, then the word bursts as the final image title',
  tags: ['kinetic', 'typography', 'midjourney', 'ai', 'image-gen', 'discord', 'prompt', 'digital-native', 'tech-culture'],
  category: 'captions',
  component: MidjourneyPromptComponent as any,
  defaultConfig: {
    words: ['IMAGINE', 'CREATE', 'GENERATE', 'VISUAL'],
    colors: ['#EB459E', '#5865F2', '#57F287', '#FEE75C'],
    bgColor: '#313338',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['IMAGINE', 'CREATE', 'GENERATE', 'VISUAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#EB459E', '#5865F2', '#57F287', '#FEE75C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#313338', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
