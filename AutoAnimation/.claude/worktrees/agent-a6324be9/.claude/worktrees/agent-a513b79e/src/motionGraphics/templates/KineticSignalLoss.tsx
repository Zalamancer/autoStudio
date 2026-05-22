import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SignalLossConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const SLICES = 6
const SH = 100 / SLICES

/** Render one horizontal text slice with clipping */
function Slice({ si, word, color, font, offsetX, topPct, opacity, shadow }: {
  si: number; word: string; color: string; font: string; offsetX: number; topPct: number; opacity: number; shadow?: string
}) {
  return (
    <div key={si} style={{ position: 'absolute', left: 0, right: 0, top: `${topPct}%`, height: `${SH + 1}%`, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: '50%', top: `${-si * SH}%`, height: `${SLICES * 100}%`,
        transform: `translate(calc(-50% + ${offsetX}px), 0)`,
        fontFamily: font, fontSize: 'clamp(36px, 10vw, 140px)', fontWeight: 700, color,
        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center',
        letterSpacing: 3, opacity, textShadow: shadow,
      }}>
        {word}
      </div>
    </div>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const signalStrength = Math.max(0, Math.sin(time * 0.4) * 0.5 + 0.5)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Interference bands */}
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute', left: Math.sin(time * 2 + i * 0.9) * 15,
            right: -Math.sin(time * 2 + i * 0.9) * 15,
            top: (i / 6) * height + Math.sin(time * 3 + i * 1.7) * 6,
            height: 2 + rand(i * 53 + Math.floor(time * 5)) * 8,
            background: `rgba(255, 255, 255, ${0.02 + rand(i * 37) * 0.06})`,
          }} />
        ))}
        {/* Static noise */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(${Math.floor(rand(frame * 7) * 30)},${Math.floor(rand(frame * 7 + 1) * 30)},${Math.floor(rand(frame * 7 + 2) * 40)},0.04) 2px, transparent 4px)`,
        }} />
        {/* Signal bars */}
        <div style={{ position: 'absolute', top: 8, right: 10, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{
              width: 4, height: 4 + i * 3, borderRadius: 1,
              background: (i / 5) < signalStrength ? 'rgba(0,255,100,0.2)' : 'rgba(255,255,255,0.05)',
            }} />
          ))}
        </div>
        {signalStrength < 0.2 && (
          <div style={{ position: 'absolute', top: 8, left: 10, fontFamily: "'Courier New', monospace", fontSize: 9, color: 'rgba(255,50,50,0.15)', opacity: Math.sin(time * 8) > 0 ? 1 : 0 }}>
            NO SIGNAL
          </div>
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 139 + 47
    const font = "'Courier New', monospace"

    const wrap = (children: React.ReactNode) => (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: 'clamp(60px, 14vw, 180px)' }}>
        {children}
      </div>
    )

    if (phase === 'enter') {
      return wrap(Array.from({ length: SLICES }, (_, si) => {
        const p = Math.max(0, Math.min(1, (enterProgress - si / SLICES * 0.5) / 0.5))
        const dir = si % 2 === 0 ? 1 : -1
        return <Slice key={si} si={si} word={word} color={color} font={font} offsetX={(1 - p) * 120 * dir} topPct={si * SH} opacity={p} />
      }))
    } else if (phase === 'hold') {
      const tear = (holdProgress > 0.2 && holdProgress < 0.3) || (holdProgress > 0.6 && holdProgress < 0.68)
      return wrap(Array.from({ length: SLICES }, (_, si) => {
        const off = tear ? (rand(seed + si * 37 + Math.floor(holdProgress * 20)) - 0.5) * 20 : 0
        const shadow = tear
          ? `${off > 0 ? 3 : -3}px 0 rgba(255,0,0,0.4), ${off > 0 ? -3 : 3}px 0 rgba(0,100,255,0.4)`
          : `0 0 8px ${color}30`
        return <Slice key={si} si={si} word={word} color={color} font={font} offsetX={off} topPct={si * SH} opacity={1} shadow={shadow} />
      }))
    } else {
      return wrap(Array.from({ length: SLICES }, (_, si) => {
        const spread = exitProgress * 40 * (si - SLICES / 2)
        const dir = si % 2 === 0 ? 1 : -1
        return <Slice key={si} si={si} word={word} color={color} font={font} offsetX={exitProgress * 60 * dir} topPct={si * SH + spread} opacity={1 - exitProgress} />
      }))
    }
  },
}

function SignalLossComponent(props: MotionGraphicProps<SignalLossConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-signal-loss',
  title: 'Kinetic Signal Loss',
  description: 'Broadcast signal degradation — text breaks into horizontal slices with static interference, signal bars, and horizontal tearing',
  tags: ['kinetic', 'typography', 'signal', 'broadcast', 'tv', 'static', 'digital', 'corruption'],
  category: 'captions',
  component: SignalLossComponent as any,
  defaultConfig: {
    words: ['SIGNAL', 'LOST', 'STATIC', 'DEAD'],
    colors: ['#FFFFFF', '#CCCCCC', '#FFFFFF', '#AAAAAA'],
    bgColor: '#080808',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SIGNAL', 'LOST', 'STATIC', 'DEAD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#CCCCCC', '#FFFFFF', '#AAAAAA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
