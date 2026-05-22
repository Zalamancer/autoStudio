import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShadowPuppetConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Warm candlelight glow that flickers
    const flickerSeed = Math.sin(time * 8.3) * 0.5 + Math.sin(time * 13.1) * 0.3
    const glowIntensity = 0.12 + flickerSeed * 0.04
    const lightX = 50 + Math.sin(time * 1.5) * 5
    const lightY = 75 + Math.sin(time * 2.1) * 3

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Candlelight warm glow from below */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 60% 50% at ${lightX}% ${lightY}%, rgba(255,180,60,${glowIntensity}), transparent 70%)`,
          }}
        />
        {/* Fabric screen texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 80% 70% at 50% 50%, rgba(255,240,200,0.03), transparent 80%)`,
          }}
        />
        {/* Stick / rod line at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '48%',
            width: 3,
            height: '20%',
            background: 'rgba(60,40,20,0.4)',
            borderRadius: 2,
            transform: `rotate(${Math.sin(time * 1.2) * 3}deg)`,
            transformOrigin: 'bottom center',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30
    let opacity = 0
    let scale = 1
    let shadowBlur = 8
    let shadowOffsetX = 0
    let shadowOffsetY = 0

    // Light source sway affects shadow direction
    const lightAngle = Math.sin(time * 1.5) * 15
    const baseShadowX = Math.sin(lightAngle * Math.PI / 180) * 12
    const baseShadowY = 8 + Math.cos(lightAngle * Math.PI / 180) * 4

    if (phase === 'enter') {
      // Puppet rises from below into the light
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.3 + enterProgress * 0.7
      shadowBlur = 20 - enterProgress * 12
      shadowOffsetX = baseShadowX * enterProgress
      shadowOffsetY = baseShadowY * enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Shadow sways with the "light source"
      shadowOffsetX = baseShadowX + Math.sin(holdProgress * Math.PI * 3) * 3
      shadowOffsetY = baseShadowY + Math.cos(holdProgress * Math.PI * 2) * 2
      shadowBlur = 8 + Math.sin(holdProgress * Math.PI * 4) * 3
    } else {
      // Puppet drops away, shadow stretches dramatically
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.4
      shadowBlur = 8 + exitProgress * 30
      shadowOffsetX = baseShadowX * (1 + exitProgress * 2)
      shadowOffsetY = baseShadowY * (1 + exitProgress * 3)
    }

    const puppetSway = Math.sin(time * 2.3) * 2

    return (
      <>
        {/* The shadow silhouette (cast on the screen) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${shadowOffsetX}px), calc(-50% + ${shadowOffsetY}px)) scale(${scale * 1.15}) rotate(${puppetSway * 0.5}deg)`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color: 'rgba(0,0,0,0.7)',
            filter: `blur(${shadowBlur}px)`,
            opacity: opacity * 0.6,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Secondary diffuse shadow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${shadowOffsetX * 1.8}px), calc(-50% + ${shadowOffsetY * 1.8}px)) scale(${scale * 1.3}) rotate(${puppetSway}deg)`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color: 'rgba(0,0,0,0.3)',
            filter: `blur(${shadowBlur * 2.5}px)`,
            opacity: opacity * 0.35,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Main text silhouette (the puppet itself) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${puppetSway}deg)`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color: 'rgba(20,10,5,0.9)',
            textShadow: `0 0 2px rgba(255,180,60,0.3), 0 0 20px rgba(255,140,40,${opacity * 0.15})`,
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Rim light on edges */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${puppetSway}deg)`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color: 'transparent',
            WebkitTextStroke: `1px rgba(255,200,100,${opacity * 0.25})`,
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function ShadowPuppetComponent(props: MotionGraphicProps<ShadowPuppetConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shadow-puppet',
  title: 'Kinetic Shadow Puppet',
  description: 'Text as shadow puppet silhouette cast by a flickering candlelight, with swaying shadows and warm backlight on a screen',
  tags: ['kinetic', 'typography', 'shadow', 'puppet', 'silhouette', 'light', 'theater', 'warm'],
  category: 'captions',
  component: ShadowPuppetComponent as any,
  defaultConfig: {
    words: ['SHADOW', 'PLAY', 'LIGHT', 'DARK'],
    colors: ['#2A1810', '#1A0E08', '#2A1810', '#1A0E08'],
    bgColor: '#1a1408',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHADOW', 'PLAY', 'LIGHT', 'DARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2A1810', '#1A0E08', '#2A1810', '#1A0E08'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1408', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
