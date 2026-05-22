import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HorrorCrawlConfig extends KineticBaseConfig {
  crawlSpeed: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Horror film title crawl: Carpenter, Argento, Craven
    // Slow creep, blood drip, flicker, pulse
    const flickerAlpha = rand(Math.floor(time * 12)) > 0.9 ? 0.15 : 0

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Horror red pulse — deep arterial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(${120 + Math.sin(time * 1.2) * 30},0,0,${0.15 + Math.sin(time * 0.8) * 0.05}) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Flicker — projector malfunction */}
        {flickerAlpha > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(255,255,255,${flickerAlpha})`,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Blood drips from top */}
        {[0.15, 0.32, 0.51, 0.68, 0.84].map((x, i) => {
          const dripLen = 15 + rand(i * 13) * 25 + Math.sin(time * (0.3 + i * 0.1)) * 5
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x * 100}%`,
                top: 0,
                width: 2 + (i % 2),
                height: dripLen,
                background: `linear-gradient(to bottom, rgba(180,0,0,0.8), rgba(140,0,0,0.3))`,
                borderRadius: '0 0 50% 50%',
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Horror vignette — deep black edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Scratches — old horror print */}
        {rand(Math.floor(time * 6)) > 0.75 && (
          <div
            style={{
              position: 'absolute',
              left: `${rand(Math.floor(time * 7)) * 90 + 5}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: `rgba(200,0,0,${0.08 + rand(Math.floor(time * 11)) * 0.06})`,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Creeping texture — biological horror */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(${time * 3}deg, transparent, transparent 8px, rgba(80,0,0,0.015) 9px)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Horror crawl: slow, inevitable, rising from below
    let translateY = 0
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      // Creeps up from below — slow crawl entry
      const ease = Math.pow(enterProgress, 0.5) // fast start, slow finish
      translateY = (1 - ease) * 60
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      // Imperceptible slow rise — still crawling
      translateY = -(holdProgress * 6)
      opacity = 1
      // Pulse — heartbeat of the horror
      scale = 1 + Math.sin(t * 2.5 + index) * 0.006
    } else {
      // Dissolves into black — consumed
      opacity = 1 - exitProgress * exitProgress
      scale = 1 - exitProgress * 0.05
    }

    // Very faint position shimmer — something is wrong
    const grimX = Math.sin(t * 7.3 + index * 3.1) * 0.4
    const grimY = Math.cos(t * 5.7) * 0.3

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${grimX}px), calc(-50% + ${translateY + grimY}px)) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(46px, 12.5vw, 168px)',
          fontWeight: 400,
          fontStyle: 'italic',
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: 14,
          textShadow: `0 0 20px rgba(160,0,0,0.6), 0 0 50px rgba(100,0,0,0.3), 0 2px 6px rgba(0,0,0,0.9)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function HorrorCrawlComponent(props: MotionGraphicProps<HorrorCrawlConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-horror-crawl',
  title: 'Kinetic Horror Crawl',
  description: 'Horror film title crawl — slow inevitable rise from below, blood drips, lamp flicker, deep red pulse vignette, scratched print, and heartbeat scale pulsing during hold',
  tags: ['kinetic', 'typography', 'horror', 'crawl', 'blood', 'thriller', 'carpenter', 'argento', 'title'],
  category: 'captions',
  component: HorrorCrawlComponent as any,
  defaultConfig: {
    words: ['FEAR', 'DARKNESS', 'EVIL', 'DEAD'],
    colors: ['#CC0000', '#FF2222', '#CC0000', '#FF0000'],
    bgColor: '#030000',
    cycleDuration: 1.8,
    crawlSpeed: 60,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FEAR', 'DARKNESS', 'EVIL', 'DEAD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CC0000', '#FF2222', '#CC0000', '#FF0000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.6, max: 6, group: 'Timing' },
    { key: 'crawlSpeed', label: 'Crawl Speed (px)', type: 'number', defaultValue: 60, min: 20, max: 150, group: 'Animation' },
  ],
})
