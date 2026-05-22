import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TeleTypeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Continuous form paper background
    const lineHeight = 18
    const totalLines = Math.ceil(height / lineHeight) + 2

    // Paper feed animation: slow upward scroll
    const feedOffset = (time * 8) % lineHeight

    // Paper texture lines
    const paperLines: React.ReactNode[] = []
    for (let i = 0; i < totalLines; i++) {
      const y = i * lineHeight - feedOffset
      // Alternating faint blue/green tractor-feed lines
      const isGuideLine = i % 3 === 0
      paperLines.push(
        <div
          key={`line-${i}`}
          style={{
            position: 'absolute',
            left: 30,
            right: 30,
            top: y,
            height: 1,
            background: isGuideLine ? 'rgba(100,160,200,0.08)' : 'rgba(100,160,200,0.03)',
            pointerEvents: 'none',
          }}
        />,
      )
    }

    // Tractor feed holes (sprocket holes along edges)
    const holeCount = Math.ceil(height / 14) + 2
    const tractorHoles: React.ReactNode[] = []
    for (let i = 0; i < holeCount; i++) {
      const y = i * 14 - (feedOffset * 14) / lineHeight
      tractorHoles.push(
        <div key={`hole-l-${i}`}>
          {/* Left sprocket hole */}
          <div
            style={{
              position: 'absolute',
              left: 8,
              top: y,
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(200,190,170,0.04)',
            }}
          />
          {/* Right sprocket hole */}
          <div
            style={{
              position: 'absolute',
              right: 8,
              top: y,
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(200,190,170,0.04)',
            }}
          />
        </div>,
      )
    }

    // Previous printed text (faded, scrolling up)
    const ghostLines = [
      'THE QUICK BROWN FOX JUMPS',
      'OVER THE LAZY DOG 1234567',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '*** MESSAGE RECEIVED ***',
      '',
      'BAUDOT CODE ACTIVE',
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Continuous form paper base */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#F5F0E0',
            opacity: 0.03,
          }}
        />

        {paperLines}
        {tractorHoles}

        {/* Ghost text (previously printed, scrolling up) */}
        {ghostLines.map((line, i) => (
          <div
            key={`ghost-${i}`}
            style={{
              position: 'absolute',
              left: 36,
              top: 12 + i * lineHeight - feedOffset,
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 10,
              color: '#8B7355',
              opacity: 0.07,
              whiteSpace: 'pre',
              letterSpacing: 1,
            }}
          >
            {line}
          </div>
        ))}

        {/* Ribbon ink smudge effect (very subtle) */}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '20%',
            right: '20%',
            height: 3,
            background: 'rgba(40,30,20,0.03)',
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />

        {/* Paper perforation line (tear strip) */}
        <div
          style={{
            position: 'absolute',
            top: height * 0.25 - (feedOffset % (height * 0.25)),
            left: 24,
            right: 24,
            height: 1,
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 3px, transparent 3px, transparent 8px)',
            pointerEvents: 'none',
          }}
        />

        {/* Slight paper curl shadow at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 20,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.15), transparent)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    if (phase === 'enter') {
      // Mechanical teletype: character hammer strikes one at a time
      const totalChars = word.length
      const charsToShow = Math.floor(enterProgress * (totalChars + 1))

      const chars = word.split('').map((ch, ci) => {
        if (ci >= charsToShow) return null

        // Hammer strike effect: character bounces on impact
        const isNewest = ci === charsToShow - 1
        const strikePhase = isNewest ? (enterProgress * totalChars) % 1 : 1
        const impactBounce = isNewest && strikePhase < 0.4 ? Math.sin(strikePhase * Math.PI * 2.5) * 3 : 0

        // Ink transfer: newest char is slightly bolder/darker
        const inkDensity = isNewest ? 1.2 : 1
        // Older characters fade slightly (ink drying)
        const age = (charsToShow - ci) / totalChars
        const inkFade = Math.max(0.7, 1 - age * 0.3)

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translateY(${impactBounce}px)`,
              color,
              opacity: inkFade * inkDensity,
              textShadow: isNewest ? `0 1px 1px rgba(0,0,0,0.3)` : 'none',
            }}
          >
            {ch}
          </span>
        )
      })

      // Carriage position indicator
      const carriageX = charsToShow / (totalChars + 1)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Print head / carriage indicator */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: `${carriageX * 100}%`,
              width: 16,
              height: 6,
              background: '#555',
              transform: 'translateX(-50%)',
              borderRadius: 1,
              opacity: 0.3,
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          />
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(36px, 9vw, 130px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
            }}
          >
            {chars}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Steady printed text with subtle paper vibration from mechanism
      const vibrate = Math.sin(f * 0.5) * 0.3
      const inkWear = Math.sin(f * 0.02) * 0.03

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${vibrate}px))`,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            opacity: 0.95 + inkWear,
            textShadow: '0 0.5px 0 rgba(0,0,0,0.15)',
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: paper advances upward, text scrolls off with new paper feeding in
      const scrollUp = exitProgress * 80
      const fadeOut = Math.max(0, 1 - exitProgress * 1.3)

      // Bell ring indicator at start of exit
      const bellFlash = exitProgress < 0.15 ? (0.15 - exitProgress) * 6 : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% - ${scrollUp}px))`,
            opacity: fadeOut,
          }}
        >
          {/* Bell indicator */}
          {bellFlash > 0 && (
            <div
              style={{
                position: 'absolute',
                top: -30,
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: "'Courier New', monospace",
                fontSize: 12,
                color: '#FFD700',
                opacity: bellFlash,
              }}
            >
              {'\u266A BELL'}
            </div>
          )}
          <div
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(36px, 9vw, 130px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              textShadow: '0 0.5px 0 rgba(0,0,0,0.15)',
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function TeleTypeComponent(props: MotionGraphicProps<TeleTypeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-teletype',
  title: 'Kinetic TeleType',
  description:
    'Mechanical teletype TTY printing on continuous form paper with character hammer strike, ribbon ink, tractor feed sprocket holes, paper advance, and bell',
  tags: ['kinetic', 'typography', 'teletype', 'tty', 'mechanical', 'paper', 'printer', 'retro', 'computing'],
  category: 'captions',
  component: TeleTypeComponent as any,
  defaultConfig: {
    words: ['SEND', 'STOP', 'BELL', 'FEED'],
    colors: ['#2A1F14', '#2A1F14', '#2A1F14', '#2A1F14'],
    bgColor: '#1a1510',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SEND', 'STOP', 'BELL', 'FEED'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#2A1F14', '#2A1F14', '#2A1F14', '#2A1F14'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1510', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
