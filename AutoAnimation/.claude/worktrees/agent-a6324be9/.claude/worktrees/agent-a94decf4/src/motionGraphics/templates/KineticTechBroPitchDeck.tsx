import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Subculture: Tech Bro Pitch Deck — clean sans, blue/white, bullet point energy, ROI brain
// Mechanic: text slides in from left like a PowerPoint bullet point, progress bar highlights

interface TechBroPitchDeckConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Clean gradient like a Sequoia deck slide
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, #f8fafc 0%, #eef2f7 100%)',
        }}
      >
        {/* Very thin grid — pitch deck structure */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Top progress bar — slide X of Y energy */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#e2e8f0' }}>
          <div
            style={{
              height: '100%',
              width: `${((time % 8) / 8) * 100}%`,
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        {/* Slide number indicator */}
        <div style={{ position: 'absolute', bottom: '4%', right: '4%', fontFamily: 'sans-serif', fontSize: 11, color: '#94a3b8', letterSpacing: 1 }}>
          SLIDE {Math.floor(time / 2) % 12 + 1} / 12
        </div>

        {/* Bullet point indicator */}
        <div style={{ position: 'absolute', left: '8%', top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // PowerPoint bullet slide-in from left — peak tech bro energy
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    let opacity = 0
    let translateX = 0
    let scale = 1

    if (phase === 'enter') {
      const e = easeOut(enterProgress)
      opacity = e
      translateX = (1 - e) * -60    // slides in from left
      scale = 0.98 + e * 0.02
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
      scale = 1
    } else {
      // Fade out upward — clean exit
      opacity = 1 - exitProgress
      translateX = exitProgress * 20
      scale = 1 - exitProgress * 0.02
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
          opacity,
          fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(28px, 7.5vw, 100px)',
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: -1,
          color: color || '#0f172a',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function TechBroPitchDeckComponent(props: MotionGraphicProps<TechBroPitchDeckConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tech-bro-pitch-deck',
  title: 'Kinetic Tech Bro Pitch Deck',
  description: 'Tech bro pitch deck aesthetic: clean Inter slides in from left like a PowerPoint bullet on grid background with progress bar',
  tags: ['kinetic', 'typography', 'tech', 'startup', 'pitch deck', 'clean', 'subculture', 'corporate'],
  category: 'captions',
  component: TechBroPitchDeckComponent as any,
  defaultConfig: {
    words: ['10x', 'Growth', 'Scale', 'Disrupt'],
    colors: ['#0f172a', '#3b82f6', '#0f172a', '#1e40af'],
    bgColor: '#f8fafc',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['10x', 'Growth', 'Scale', 'Disrupt'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0f172a', '#3b82f6', '#0f172a', '#1e40af'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f8fafc', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
