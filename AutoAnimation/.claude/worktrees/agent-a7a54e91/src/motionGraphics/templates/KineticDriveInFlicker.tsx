import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DriveInFlickerConfig extends KineticBaseConfig {
  flickerRate: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Night sky — the drive-in outdoor setting
    const stars = Array.from({ length: 30 }, (_, i) => {
      const sx = rand(i * 53) * 100
      const sy = rand(i * 71) * 40 // only top 40% is sky
      const ssize = rand(i * 37) * 2 + 0.5
      const twinkle = Math.sin(time * (1 + rand(i * 29) * 2) + i * 1.9) * 0.4 + 0.6
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${sx}%`,
            top: `${sy}%`,
            width: ssize,
            height: ssize,
            borderRadius: '50%',
            background: `rgba(255,255,255,${twinkle * 0.5})`,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Night sky gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(5,8,20,0.8) 0%, rgba(10,12,18,0.4) 40%, transparent 60%)',
          }}
        />
        {stars}
        {/* Large outdoor screen frame */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '4%',
            right: '4%',
            bottom: '20%',
            border: '16px solid rgba(60,50,40,0.9)',
            background: 'rgba(0,0,0,0.95)',
            boxShadow: '0 0 0 4px rgba(40,30,20,0.5)',
          }}
        />
        {/* Screen support poles */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '30%',
            width: 12,
            height: '22%',
            background: 'rgba(50,40,30,0.8)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: '30%',
            width: 12,
            height: '22%',
            background: 'rgba(50,40,30,0.8)',
          }}
        />
        {/* Projector beam from lower-center (booth) */}
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '80px solid transparent',
            borderRight: '80px solid transparent',
            borderBottom: '400px solid rgba(255,240,200,0.015)',
            filter: 'blur(15px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let scale = 1
    let flickerOpacity = 1
    let screenGlow = 0
    let translateY = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.85 + p * 0.15
      // Projector warming up — stuttery flicker
      if (enterProgress < 0.3) {
        flickerOpacity = rand(f * 7) > 0.4 ? 1 : 0.1
      } else {
        flickerOpacity = 1
      }
      screenGlow = p
      translateY = (1 - p) * 30
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Mechanical flicker — 24fps gate weave
      flickerOpacity = 0.92 + Math.sin(time * 24 * Math.PI * 2) * 0.04 + rand(f) * 0.04
      screenGlow = 1
      // Gentle screen shake — drive-in projector wobble
      translateY = Math.sin(holdProgress * Math.PI * 12) * 0.8
    } else {
      const p = easeOutExpo(exitProgress)
      opacity = 1 - exitProgress
      // Film end flicker — bright flashes as reel runs out
      flickerOpacity = exitProgress > 0.6
        ? rand(f * 11) > 0.5 ? 1.5 : 0
        : 1
      screenGlow = 1 - exitProgress
      translateY = p * 20
    }

    return (
      <>
        {/* Screen backglow — light spillover at screen edges */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '4%',
            right: '4%',
            bottom: '20%',
            background: `rgba(200,195,185,${screenGlow * flickerOpacity * 0.06})`,
          }}
        />
        {/* Projected text on screen — with film grain */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(30px, 9vw, 120px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 12,
            color,
            opacity: opacity * flickerOpacity,
            whiteSpace: 'nowrap',
            textShadow: `0 0 15px rgba(255,255,200,${screenGlow * 0.3}), 0 0 3px rgba(255,255,200,0.5)`,
          }}
        >
          {word}
        </div>
        {/* Scan line grain over the screen area */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '4%',
            right: '4%',
            bottom: '20%',
            backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 4px)`,
            pointerEvents: 'none',
            opacity: opacity * screenGlow,
          }}
        />
        {/* Bright white overexpose flash for film flicker effect */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '4%',
            right: '4%',
            bottom: '20%',
            background: `rgba(255,255,240,${Math.max(0, flickerOpacity - 1) * 0.6})`,
            opacity,
          }}
        />
        {/* Projector lens circle — light source at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '21%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: `rgba(255,240,200,${screenGlow * flickerOpacity * 0.5})`,
            boxShadow: `0 0 10px 5px rgba(255,230,180,${screenGlow * flickerOpacity * 0.2})`,
          }}
        />
      </>
    )
  },
}

function DriveInFlickerComponent(props: MotionGraphicProps<DriveInFlickerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-drive-in-flicker',
  title: 'Kinetic Drive-In Flicker',
  description: 'Text projects onto an outdoor drive-in movie screen at night — mechanical film flicker, gate weave wobble, projector beam, and reel-end overexpose flash',
  tags: ['kinetic', 'typography', 'drive-in', 'flicker', 'projection', 'cinema', 'night', 'film', 'retro'],
  category: 'captions',
  component: DriveInFlickerComponent as any,
  defaultConfig: {
    words: ['FEATURE', 'REEL', 'FLICKER', 'NIGHT'],
    colors: ['#EEE8D8', '#E0D8C4', '#EAE0CC', '#D8D0BC'],
    bgColor: '#080810',
    cycleDuration: 1.5,
    flickerRate: 24,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FEATURE', 'REEL', 'FLICKER', 'NIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#EEE8D8', '#E0D8C4', '#EAE0CC', '#D8D0BC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'flickerRate', label: 'Flicker Rate', type: 'number', defaultValue: 24, min: 8, max: 60, group: 'Animation' },
  ],
})
