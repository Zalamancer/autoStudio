import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AtomOrbitConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    const cx = width / 2
    const cy = height / 2
    const nucleusSize = Math.min(width, height) * 0.04

    // Orbiting electron paths
    const orbits = [
      { rx: 0.3, ry: 0.12, rotation: 0, speed: 1.2 },
      { rx: 0.3, ry: 0.12, rotation: 60, speed: -0.9 },
      { rx: 0.3, ry: 0.12, rotation: 120, speed: 1.5 },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Nucleus glow */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: nucleusSize,
            height: nucleusSize,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FF6B4460, #FF6B4420, transparent)',
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${30 + Math.sin(time * 3) * 10}px #FF6B4430`,
          }}
        />

        {/* Orbit ellipses */}
        {orbits.map((orbit, i) => (
          <div key={i}>
            {/* Orbit path */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: width * orbit.rx * 2,
                height: height * orbit.ry * 2,
                border: '1px solid rgba(100,200,255,0.08)',
                borderRadius: '50%',
                transform: `translate(-50%, -50%) rotate(${orbit.rotation}deg)`,
              }}
            />
            {/* Electron */}
            <div
              style={{
                position: 'absolute',
                left: `${50 + Math.cos(time * orbit.speed) * orbit.rx * 100 * Math.cos((orbit.rotation * Math.PI) / 180) - Math.sin(time * orbit.speed) * orbit.ry * 100 * Math.sin((orbit.rotation * Math.PI) / 180)}%`,
                top: `${50 + Math.cos(time * orbit.speed) * orbit.rx * 100 * Math.sin((orbit.rotation * Math.PI) / 180) + Math.sin(time * orbit.speed) * orbit.ry * 100 * Math.cos((orbit.rotation * Math.PI) / 180)}%`,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#64D8FF',
                boxShadow: '0 0 12px #64D8FF80, 0 0 24px #64D8FF30',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    let opacity = 0
    let scale = 1
    let rotation = 0
    let translateX = 0
    let translateY = 0

    if (phase === 'enter') {
      // Orbit in from an elliptical path
      const eased = 1 - Math.pow(1 - enterProgress, 4)
      opacity = Math.min(1, enterProgress * 2.5)
      const orbitAngle = (1 - eased) * Math.PI * 2
      translateX = Math.cos(orbitAngle) * 200 * (1 - eased)
      translateY = Math.sin(orbitAngle) * 80 * (1 - eased)
      scale = 0.4 + eased * 0.6
      rotation = (1 - eased) * 180
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle orbital float
      const t = time * 0.8 + index
      translateX = Math.cos(t) * 10
      translateY = Math.sin(t * 1.3) * 6
      rotation = Math.sin(t * 0.7) * 3
    } else {
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      const orbitAngle = eased * Math.PI * 2
      translateX = Math.cos(orbitAngle) * -200 * eased
      translateY = Math.sin(orbitAngle) * -80 * eased
      scale = 1 - eased * 0.6
      rotation = eased * -180
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
            opacity,
            fontSize: 'clamp(42px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textShadow: `0 0 15px ${color}44, 0 0 40px ${color}18`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function AtomOrbitComponent(props: MotionGraphicProps<AtomOrbitConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-atom-orbit',
  title: 'Kinetic Atom Orbit',
  description: 'Words orbit like electrons around a nucleus with 3D elliptical paths and glowing particle trails',
  tags: ['kinetic', 'typography', 'science', 'atom', 'physics', 'orbit', 'electron'],
  category: 'captions',
  component: AtomOrbitComponent as any,
  defaultConfig: {
    words: ['PROTON', 'NEUTRON', 'QUARK', 'FUSE'],
    colors: ['#64D8FF', '#FF6B44', '#A78BFA', '#FFE066'],
    bgColor: '#060a14',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PROTON', 'NEUTRON', 'QUARK', 'FUSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#64D8FF', '#FF6B44', '#A78BFA', '#FFE066'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
