import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LightboxPanelConfig extends KineticBaseConfig {
  panelOpacity: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Room setting — dark walls
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Room ambient gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />
        {/* Lightbox panel frame */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            left: '8%',
            right: '8%',
            bottom: '28%',
            border: '8px solid rgba(200,200,200,0.15)',
            borderRadius: 4,
          }}
        />
        {/* Corner screws */}
        {[['12%', '30%'], ['86%', '30%'], ['12%', '68%'], ['86%', '68%']].map(([l, t], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: l,
              top: t,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'rgba(180,180,180,0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let panelGlow = 0
    let textOpacity = 0
    let scale = 1
    let panelFlicker = 1
    let warmTint = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      const pBack = easeOutBack(Math.min(1, enterProgress * 1.1))

      // Fluorescent tube startup: quick flickers then settles
      if (enterProgress < 0.2) {
        const flickerPattern = Math.sin(enterProgress * 80) > 0 ? 1 : 0.1
        panelGlow = flickerPattern * enterProgress * 5
        panelFlicker = flickerPattern
      } else if (enterProgress < 0.4) {
        // Brief dim brownout
        panelGlow = 0.6 + Math.sin(enterProgress * 40) * 0.2
        panelFlicker = 0.7 + Math.sin(enterProgress * 40) * 0.2
      } else {
        panelGlow = 0.6 + p * 0.4
        panelFlicker = 1
      }
      textOpacity = p
      scale = 0.95 + pBack * 0.05
      warmTint = (1 - p) * 0.3 // warm yellow tint on startup
    } else if (phase === 'hold') {
      panelGlow = 1
      textOpacity = 1
      scale = 1
      panelFlicker = 0.97 + Math.sin(holdProgress * Math.PI * 120) * 0.01 // 60hz hum
      warmTint = 0
    } else {
      const p = easeOutExpo(exitProgress)
      // Power-off: dims then blinks out
      if (exitProgress > 0.7) {
        const blinkPhase = (exitProgress - 0.7) / 0.3
        panelGlow = Math.sin(blinkPhase * Math.PI * 8) > 0 ? (1 - blinkPhase) * 0.3 : 0
      } else {
        panelGlow = 1 - p * 0.7
      }
      textOpacity = 1 - exitProgress
      panelFlicker = 1
    }

    return (
      <>
        {/* Lightbox panel backlight */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            left: '8%',
            right: '8%',
            bottom: '28%',
            background: `rgba(${230 + warmTint * 25},${240 - warmTint * 10},${255 - warmTint * 30},${panelGlow * panelFlicker * 0.12})`,
            borderRadius: 2,
          }}
        />
        {/* Edge bloom spill from lightbox */}
        <div
          style={{
            position: 'absolute',
            top: '24%',
            left: '4%',
            right: '4%',
            bottom: '24%',
            background: `rgba(220,235,255,${panelGlow * panelFlicker * 0.04})`,
            filter: 'blur(20px)',
            borderRadius: 8,
          }}
        />
        {/* Light diffusion — frosted glass effect */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            left: '8%',
            right: '8%',
            bottom: '28%',
            background: `radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255,255,255,${panelGlow * 0.08}) 0%, rgba(220,235,255,${panelGlow * 0.04}) 60%, transparent 100%)`,
          }}
        />
        {/* Text on the lightbox */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            opacity: textOpacity * panelGlow * panelFlicker,
            whiteSpace: 'nowrap',
            textShadow: `0 0 12px rgba(255,255,255,${panelGlow * 0.4}), 0 0 4px rgba(255,255,255,${panelGlow * 0.6})`,
          }}
        >
          {word}
        </div>
        {/* Room spill — light cast from panel onto surroundings */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            background: `radial-gradient(ellipse 60% 40% at 50% 50%, rgba(210,230,255,${panelGlow * panelFlicker * 0.03}) 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
      </>
    )
  },
}

function LightboxPanelComponent(props: MotionGraphicProps<LightboxPanelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lightbox-panel',
  title: 'Kinetic Lightbox Panel',
  description: 'A backlit lightbox panel switches on with fluorescent tube flicker — text glows against the diffused backlight with room spill light and a 60Hz hum pulse',
  tags: ['kinetic', 'typography', 'lightbox', 'panel', 'backlit', 'fluorescent', 'display', 'sign', 'studio'],
  category: 'captions',
  component: LightboxPanelComponent as any,
  defaultConfig: {
    words: ['LIGHT', 'BOX', 'GLOW', 'ON'],
    colors: ['#000820', '#001030', '#000820', '#001030'],
    bgColor: '#0a0c10',
    cycleDuration: 1.6,
    panelOpacity: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIGHT', 'BOX', 'GLOW', 'ON'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#000820', '#001030', '#000820', '#001030'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0c10', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
    { key: 'panelOpacity', label: 'Panel Brightness', type: 'number', defaultValue: 80, min: 20, max: 100, group: 'Animation' },
  ],
})
