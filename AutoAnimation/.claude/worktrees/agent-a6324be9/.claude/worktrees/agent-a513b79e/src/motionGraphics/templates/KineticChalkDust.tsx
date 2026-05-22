import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChalkDustConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Slate texture — dark matte surface with subtle grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(175deg, transparent 0px, transparent 30px, rgba(255,255,255,0.008) 30px, rgba(255,255,255,0.008) 31px),
              repeating-linear-gradient(85deg, transparent 0px, transparent 40px, rgba(255,255,255,0.005) 40px, rgba(255,255,255,0.005) 41px)
            `,
            mixBlendMode: 'screen' as const,
          }}
        />
        {/* Previous chalk smudges — ghosted erasures */}
        {[
          { x: '15%', y: '30%', w: 120, h: 30, rot: -5 },
          { x: '60%', y: '65%', w: 90, h: 25, rot: 3 },
          { x: '35%', y: '78%', w: 100, h: 28, rot: -2 },
        ].map((smudge, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: smudge.x,
              top: smudge.y,
              width: smudge.w,
              height: smudge.h,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '40% 60% 50% 50%',
              transform: `rotate(${smudge.rot}deg)`,
              filter: 'blur(8px)',
              mixBlendMode: 'screen' as const,
            }}
          />
        ))}
        {/* Chalk tray at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '5%',
            right: '5%',
            height: 14,
            background: 'linear-gradient(180deg, rgba(80,70,60,0.4), rgba(60,50,40,0.6))',
            borderRadius: '2px 2px 0 0',
            boxShadow: '0 -1px 4px rgba(0,0,0,0.2)',
          }}
        >
          {/* Small chalk pieces in tray */}
          {[0.15, 0.35, 0.7].map((xp, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${xp * 100}%`,
                bottom: 3,
                width: 20 + i * 5,
                height: 5,
                background: ['#e8e4dc', '#f5d4a8', '#c8e0c0'][i],
                borderRadius: 2,
                transform: `rotate(${(i - 1) * 8}deg)`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
        {/* Board frame edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.4), inset 0 0 100px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let pressureScale = 1
      let dustOpacity = 0

      if (phase === 'enter') {
        // Chalk pressed and dragged: each char drawn with pressure
        const delay = (ci / (word.length + 1)) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutCubic(p)

        charOpacity = ep
        // Chalk pressure starts heavy (thick) then lifts
        pressureScale = 0.85 + ep * 0.15
        // Dust falls as chalk makes contact
        dustOpacity = p > 0.1 && p < 0.9 ? (1 - Math.abs(p - 0.5) * 2) * 0.8 : 0
      } else if (phase === 'hold') {
        // Settled chalk — subtle vibration from board resonance
        const wt = t * 1.5 + ci * 0.5
        yOff = Math.sin(wt) * 0.8
        pressureScale = 1 + Math.sin(t * 2 + ci * 0.3) * 0.01
        // Lingering dust particles still settling
        dustOpacity = 0.15 + Math.sin(holdProgress * Math.PI) * 0.1
      } else {
        // Eraser smudge wipe — horizontal blur and smear
        const delay = (ci / (word.length + 1)) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.75))

        charOpacity = 1 - easeOutCubic(p)
        // Smear horizontally as eraser passes
        yOff = p * 3
        dustOpacity = p > 0.1 && p < 0.8 ? (1 - Math.abs(p - 0.45) * 2.5) * 0.6 : 0
      }

      // Chalk dust particles falling from each character
      const dustParticles =
        dustOpacity > 0.05
          ? Array.from({ length: 5 }, (_, di) => {
              const px = (rand(ci * 31 + di * 17 + index * 7) - 0.5) * 24
              const fallProgress = (t * 0.8 + di * 0.2 + ci * 0.15) % 1
              const py = fallProgress * 40
              const size = 1 + rand(ci * 13 + di * 23) * 2
              return (
                <div
                  key={di}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${px}px)`,
                    top: `calc(100% + ${py}px)`,
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: color,
                    opacity: dustOpacity * (1 - fallProgress) * 0.6,
                    pointerEvents: 'none',
                  }}
                />
              )
            })
          : null

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scale(${pressureScale})`,
            textShadow: `
              0 0 3px ${color}60,
              1px 1px 0 rgba(0,0,0,0.3)
            `,
            // Chalk texture: rough edges via text-stroke
            WebkitTextStroke: `0.5px ${color}90`,
            mixBlendMode: 'screen' as const,
          }}
        >
          {ch}
          {dustParticles}
        </span>
      )
    })

    // Eraser smudge ghost during exit
    const smudgeOpacity = phase === 'exit' ? exitProgress * 0.2 : 0

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Smudge trail left behind by eraser */}
        {smudgeOpacity > 0.02 && (
          <div
            style={{
              position: 'absolute',
              top: '48%',
              left: '10%',
              right: '10%',
              height: '12%',
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,${smudgeOpacity}) 30%, rgba(255,255,255,${smudgeOpacity * 0.6}) 70%, transparent)`,
              filter: 'blur(6px)',
              mixBlendMode: 'screen' as const,
              clipPath: `inset(0 ${(1 - exitProgress) * 100}% 0 0)`,
              pointerEvents: 'none',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Segoe Print', 'Comic Sans MS', 'Caveat', cursive",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function ChalkDustComponent(props: MotionGraphicProps<ChalkDustConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-chalk-dust',
  title: 'Kinetic Chalk Dust',
  description:
    'Chalk drawn per-character with falling dust particles, pressure variation, and eraser smudge wipe exit. Slate board with chalk tray, ghost smudges, and grain texture.',
  tags: ['kinetic', 'typography', 'chalk', 'dust', 'chalkboard', 'handmade', 'organic', 'warm'],
  category: 'captions',
  component: ChalkDustComponent as any,
  defaultConfig: {
    words: ['SKETCH', 'WRITE', 'DRAW', 'DUST'],
    colors: ['#F0EDE4', '#FFE0A0', '#B8E8C0', '#E0C8F0'],
    bgColor: '#1E2A1E',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SKETCH', 'WRITE', 'DRAW', 'DUST'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Chalk Colors',
      type: 'text-array',
      defaultValue: ['#F0EDE4', '#FFE0A0', '#B8E8C0', '#E0C8F0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Board Color', type: 'color', defaultValue: '#1E2A1E', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
