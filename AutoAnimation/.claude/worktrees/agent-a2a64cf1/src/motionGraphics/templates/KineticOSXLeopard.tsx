import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OSXLeopardConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* macOS Leopard brushed metal / pinstripe background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(200,200,210,0.03) 0px, rgba(200,200,210,0.03) 1px, transparent 1px, transparent 2px)',
          }}
        />

        {/* Aqua window chrome */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 24,
            right: 24,
            bottom: 30,
            borderRadius: 8,
            background: 'linear-gradient(180deg, #e8e8ec 0%, #d0d0d8 2%, #c8c8d0 4%, #d8d8e0 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Glossy title bar with Aqua gradient */}
          <div
            style={{
              height: 24,
              background: 'linear-gradient(180deg, #e8e8f0 0%, #d0d0d8 40%, #b8b8c4 41%, #c8c8d2 100%)',
              borderBottom: '1px solid #a0a0a8',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 10,
              paddingRight: 10,
              position: 'relative',
            }}
          >
            {/* Traffic light buttons */}
            <div style={{ display: 'flex', gap: 6, zIndex: 1 }}>
              {/* Close (red) */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #FF7F6E, #FF5F4E, #E54A3A)',
                  border: '1px solid #D93D2E',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)',
                }}
              />
              {/* Minimize (yellow) */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #FFD860, #FFC42E, #E5A91E)',
                  border: '1px solid #C89818',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)',
                }}
              />
              {/* Maximize (green) */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #6ED86E, #4EC84E, #38B038)',
                  border: '1px solid #2EA02E',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)',
                }}
              />
            </div>
            {/* Window title text */}
            <span
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: "'Lucida Grande', 'Helvetica Neue', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: '#444450',
                textShadow: '0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              TextEdit
            </span>
          </div>

          {/* Window content area - white with subtle gradient */}
          <div
            style={{
              position: 'absolute',
              top: 24,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, #ffffff 0%, #f8f8fa 100%)',
            }}
          />
        </div>

        {/* Dock at bottom (simplified) */}
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: '20%',
            right: '20%',
            height: 20,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Dock icons (small colored squares) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 6,
              padding: '0 10px',
            }}
          >
            {['#4A90D9', '#E84D3D', '#F5A623', '#7ED321', '#9B59B6', '#1ABC9C'].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: `radial-gradient(circle at 35% 35%, ${c}CC, ${c})`,
                  boxShadow: `0 1px 2px rgba(0,0,0,0.2)`,
                  opacity: 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // macOS scale-bounce window open animation (Genie effect inspired)
      const t = enterProgress
      // Overshoot spring: goes to ~1.08 then settles to 1.0
      const spring = t < 0.7
        ? (t / 0.7) * 1.08
        : 1.08 - (t - 0.7) / 0.3 * 0.08
      const scale = Math.min(spring, 1.08)
      const opacity = Math.min(1, t * 3)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            transformOrigin: 'center bottom',
          }}
        >
          {/* Glossy Aqua text with reflection */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                fontFamily: "'Lucida Grande', 'Helvetica Neue', system-ui, sans-serif",
                fontSize: 'clamp(40px, 11vw, 150px)',
                fontWeight: 800,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: 1,
                // Aqua-era glossy text shadow
                textShadow: `0 1px 0 rgba(255,255,255,0.6), 0 -1px 0 rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.15)`,
              }}
            >
              {word}
            </div>
            {/* Aqua glossy highlight on top half of text */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '45%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Subtle glossy shimmer moving across text
      const shimmerX = ((f * 0.4) % 200) - 50

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                fontFamily: "'Lucida Grande', 'Helvetica Neue', system-ui, sans-serif",
                fontSize: 'clamp(40px, 11vw, 150px)',
                fontWeight: 800,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: 1,
                textShadow: `0 1px 0 rgba(255,255,255,0.6), 0 -1px 0 rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.15)`,
              }}
            >
              {word}
            </div>
            {/* Glossy top highlight */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '45%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)',
                pointerEvents: 'none',
                borderRadius: 4,
              }}
            />
            {/* Moving specular highlight */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: `${shimmerX}%`,
                width: '30%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
          </div>
          {/* Reflection beneath text (Leopard-era floor reflection) */}
          <div
            style={{
              transform: 'scaleY(-0.4) translateY(-10px)',
              opacity: 0.15,
              fontFamily: "'Lucida Grande', 'Helvetica Neue', system-ui, sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 1,
              maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      // Exit: scale down to dock (Genie minimize)
      const t = exitProgress
      const scale = 1 - t * 0.85
      const translateY = t * 80
      const opacity = 1 - t

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            opacity,
            transformOrigin: 'center bottom',
          }}
        >
          <div
            style={{
              fontFamily: "'Lucida Grande', 'Helvetica Neue', system-ui, sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 1,
              textShadow: `0 1px 0 rgba(255,255,255,0.6), 0 4px 8px rgba(0,0,0,0.15)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function OSXLeopardComponent(props: MotionGraphicProps<OSXLeopardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-osx-leopard',
  title: 'Kinetic OSX Leopard',
  description:
    'macOS Leopard Aqua era with glossy lickable text, pinstripe background, traffic light buttons, floor reflection, Genie open/close, and specular shimmer',
  tags: ['kinetic', 'typography', 'macos', 'osx', 'leopard', 'aqua', 'glossy', 'computing'],
  category: 'captions',
  component: OSXLeopardComponent as any,
  defaultConfig: {
    words: ['AQUA', 'EXPOSE', 'FINDER', 'DOCK'],
    colors: ['#2C5CC5', '#FFFFFF', '#2C5CC5', '#FFFFFF'],
    bgColor: '#8090a0',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['AQUA', 'EXPOSE', 'FINDER', 'DOCK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#2C5CC5', '#FFFFFF', '#2C5CC5', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#8090a0', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
