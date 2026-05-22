import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TrackerModuleConfig extends KineticBaseConfig {}

// ProTracker note names
const NOTES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-']
const OCTAVES = ['2', '3', '4', '5']

// ProTracker effect commands
const EFFECTS = ['000', '100', '200', '300', '400', 'A0F', 'C40', 'F06', 'E91', 'D00', 'B00', '910']

// Channel colors (classic ProTracker palette)
const CHANNEL_COLORS = ['#AAAAFF', '#FFAAAA', '#AAFFAA', '#FFFFAA']

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

function generatePatternRow(rowIdx: number, time: number): string[] {
  const channels: string[] = []
  for (let ch = 0; ch < 4; ch++) {
    const seed = rowIdx * 4 + ch + Math.floor(time * 2)
    const hasNote = seededRandom(seed) > 0.35
    if (hasNote) {
      const noteIdx = Math.floor(seededRandom(seed * 137) * NOTES.length)
      const octIdx = Math.floor(seededRandom(seed * 241) * OCTAVES.length)
      const effIdx = Math.floor(seededRandom(seed * 317) * EFFECTS.length)
      const vol = Math.floor(seededRandom(seed * 431) * 64)
      const volHex = vol.toString(16).toUpperCase().padStart(2, '0')
      channels.push(`${NOTES[noteIdx]}${OCTAVES[octIdx]} 01 ${volHex} ${EFFECTS[effIdx]}`)
    } else {
      channels.push('--- 00 00 000')
    }
  }
  return channels
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Pattern view: show ~16 rows of tracker data
    const visibleRows = 16
    const rowHeight = 14
    const startY = 30
    const channelWidth = (width - 40) / 4

    // Current playing row (scrolls)
    const currentRow = Math.floor(time * 6) % 64

    const rows: React.ReactNode[] = []
    for (let r = 0; r < visibleRows; r++) {
      const rowNum = (currentRow + r - Math.floor(visibleRows / 2) + 64) % 64
      const isCurrentRow = r === Math.floor(visibleRows / 2)
      const channels = generatePatternRow(rowNum, time)

      // Row number
      rows.push(
        <div
          key={`rownum-${r}`}
          style={{
            position: 'absolute',
            left: 6,
            top: startY + r * rowHeight,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: isCurrentRow ? '#FFFFFF' : '#666666',
            width: 20,
            textAlign: 'right',
          }}
        >
          {rowNum.toString(16).toUpperCase().padStart(2, '0')}
        </div>
      )

      // Channel data
      channels.forEach((chData, ci) => {
        const isActive = isCurrentRow && chData !== '--- 00 00 000'
        rows.push(
          <div
            key={`ch-${r}-${ci}`}
            style={{
              position: 'absolute',
              left: 30 + ci * channelWidth,
              top: startY + r * rowHeight,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: isCurrentRow
                ? (isActive ? CHANNEL_COLORS[ci] : '#888888')
                : (chData !== '--- 00 00 000' ? `${CHANNEL_COLORS[ci]}60` : '#333333'),
              whiteSpace: 'nowrap',
              letterSpacing: 0,
              opacity: isCurrentRow ? 0.3 : 0.1,
            }}
          >
            {chData}
          </div>
        )
      })

      // Highlight bar for current row
      if (isCurrentRow) {
        rows.push(
          <div
            key={`highlight-${r}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: startY + r * rowHeight - 1,
              height: rowHeight,
              background: 'rgba(255,255,255,0.04)',
              pointerEvents: 'none',
            }}
          />
        )
      }
    }

    // Channel separator lines
    const separators: React.ReactNode[] = []
    for (let ci = 0; ci <= 4; ci++) {
      separators.push(
        <div
          key={`sep-${ci}`}
          style={{
            position: 'absolute',
            left: 28 + ci * channelWidth,
            top: startY - 4,
            bottom: height - startY - visibleRows * rowHeight - 4,
            width: 1,
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
      )
    }

    // Channel headers
    const headers: React.ReactNode[] = []
    for (let ci = 0; ci < 4; ci++) {
      headers.push(
        <div
          key={`header-${ci}`}
          style={{
            position: 'absolute',
            left: 30 + ci * channelWidth,
            top: 14,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            fontWeight: 700,
            color: CHANNEL_COLORS[ci],
            opacity: 0.2,
          }}
        >
          Channel {ci + 1}
        </div>
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Header bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: '#222',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 6,
            paddingRight: 6,
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: 8, color: '#AAA', opacity: 0.3 }}>
            ProTracker v2.3D
          </span>
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: 8, color: '#AAA', opacity: 0.3 }}>
            Pattern {(Math.floor(time * 0.5) % 16).toString(16).toUpperCase().padStart(2, '0')}
          </span>
        </div>

        {headers}
        {separators}
        {rows}

        {/* VU meters at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: 6,
            right: 6,
            height: 8,
            display: 'flex',
            gap: 4,
          }}
        >
          {[0, 1, 2, 3].map((ch) => {
            const level = (Math.sin(time * 8 + ch * 1.5) * 0.5 + 0.5) * 100
            return (
              <div
                key={`vu-${ch}`}
                style={{
                  flex: 1,
                  height: 6,
                  background: '#111',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${level}%`,
                    background: CHANNEL_COLORS[ch],
                    opacity: 0.3,
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, index }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    if (phase === 'enter') {
      // Note trigger entrance: each character appears like a note being triggered in a channel
      const chars = word.split('')
      const elements = chars.map((ch, ci) => {
        const charProgress = Math.max(0, Math.min(1, (enterProgress * (chars.length + 2) - ci) / 1.5))
        if (charProgress <= 0) return null

        // Note trigger flash
        const triggerFlash = charProgress < 0.3 ? (0.3 - charProgress) * 3 : 0
        const channelColor = CHANNEL_COLORS[ci % CHANNEL_COLORS.length]

        return (
          <span
            key={ci}
            style={{
              color: triggerFlash > 0.1 ? '#FFFFFF' : channelColor,
              textShadow: triggerFlash > 0.1 ? `0 0 12px #FFFFFF` : `0 0 4px ${channelColor}40`,
              opacity: Math.min(1, charProgress * 2),
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 5,
          }}
        >
          {elements}
        </div>
      )
    } else if (phase === 'hold') {
      // Characters pulse to a 4-beat pattern like tracker tempo
      const bpm = 125
      const beatTime = 60 / bpm
      const beat = (time % beatTime) / beatTime
      const isBeat = beat < 0.1

      const chars = word.split('')
      const elements = chars.map((ch, ci) => {
        const channelColor = CHANNEL_COLORS[ci % CHANNEL_COLORS.length]
        const beatPulse = isBeat ? 0.15 : 0
        const waveOffset = Math.sin(time * 4 + ci * 0.8) * 3

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: channelColor,
              textShadow: `0 0 ${6 + beatPulse * 20}px ${channelColor}`,
              transform: `translateY(${waveOffset}px)`,
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 5,
          }}
        >
          {elements}
        </div>
      )
    } else {
      // Exit: note-off effect - characters fade with volume slide down
      const chars = word.split('')
      const elements = chars.map((ch, ci) => {
        const channelColor = CHANNEL_COLORS[ci % CHANNEL_COLORS.length]
        const charFade = Math.max(0, Math.min(1, (exitProgress * (chars.length + 1) - ci) / 1.5))
        const slideDown = charFade * 20

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: channelColor,
              opacity: 1 - charFade,
              transform: `translateY(${slideDown}px)`,
              textShadow: `0 0 ${(1 - charFade) * 6}px ${channelColor}40`,
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 5,
          }}
        >
          {elements}
        </div>
      )
    }
  },
}

function TrackerModuleComponent(props: MotionGraphicProps<TrackerModuleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tracker-module',
  title: 'Kinetic Tracker Module',
  description:
    'Amiga ProTracker MOD display with 4-channel pattern view, note values, hex effects column, VU meters, note trigger animation, and chiptune aesthetic',
  tags: ['kinetic', 'typography', 'tracker', 'protracker', 'mod', 'amiga', 'chiptune', 'retro', 'computing'],
  category: 'captions',
  component: TrackerModuleComponent as any,
  defaultConfig: {
    words: ['BASS', 'LEAD', 'DRUM', 'CHIP'],
    colors: ['#AAAAFF', '#FFAAAA', '#AAFFAA', '#FFFFAA'],
    bgColor: '#0a0a14',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BASS', 'LEAD', 'DRUM', 'CHIP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#AAAAFF', '#FFAAAA', '#AAFFAA', '#FFFFAA'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
