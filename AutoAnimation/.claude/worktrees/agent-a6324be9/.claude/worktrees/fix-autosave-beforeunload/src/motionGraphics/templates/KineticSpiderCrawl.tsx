import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpiderCrawlConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0

    // Spider web strands radiating from corners
    const webStrands: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = []
    const corners = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: 0, y: height },
      { x: width, y: height },
    ]

    corners.forEach((corner, ci) => {
      for (let i = 0; i < 6; i++) {
        const angle = (ci * Math.PI / 2) + (i / 6) * (Math.PI / 2)
        const len = 80 + rand(ci * 13 + i) * 120
        webStrands.push({
          x1: corner.x,
          y1: corner.y,
          x2: corner.x + Math.cos(angle) * len * (ci % 2 === 0 ? 1 : -1),
          y2: corner.y + Math.sin(angle) * len * (ci < 2 ? 1 : -1),
          opacity: 0.08 + rand(ci * 7 + i * 3) * 0.08,
        })
      }
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
        {/* Web SVG overlay */}
        <svg
          style={{ position: 'absolute', inset: 0 }}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
        >
          {webStrands.map((s, i) => (
            <line
              key={i}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke="rgba(200,200,200,1)"
              strokeWidth={0.5}
              opacity={s.opacity + Math.sin(f * 0.03 + i) * 0.02}
            />
          ))}
          {/* Concentric web arcs in top-left corner */}
          {[30, 55, 80, 110].map((r, i) => (
            <path
              key={`arc-${i}`}
              d={`M 0 ${r} Q ${r * 0.4} ${r * 0.4} ${r} 0`}
              fill="none"
              stroke="rgba(200,200,200,0.1)"
              strokeWidth={0.5}
            />
          ))}
        </svg>
        {/* Crawling spider */}
        <div
          style={{
            position: 'absolute',
            left: `${15 + ((f * 0.4) % 70)}%`,
            top: `${10 + Math.sin(f * 0.05) * 5}%`,
            fontSize: 14,
            opacity: 0.25,
            transform: `scaleX(${f % 60 < 30 ? 1 : -1})`,
          }}
        >
          {'\ud83d\udd77\ufe0f'}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 67 + 23

    let mainOpacity = 0
    let crawlOffset = 0

    if (phase === 'enter') {
      // Text crawls in from below like a spider climbing
      mainOpacity = Math.min(1, enterProgress * 1.5)
      crawlOffset = (1 - enterProgress) * 60
    } else if (phase === 'hold') {
      mainOpacity = 1
      // Slight sway like hanging from a thread
      crawlOffset = Math.sin(holdProgress * Math.PI * 4) * 3
    } else {
      mainOpacity = 1 - exitProgress
      crawlOffset = -exitProgress * 40
    }

    // Spider thread from top to text
    const threadOpacity = phase === 'enter' ? enterProgress * 0.4 : phase === 'hold' ? 0.4 : (1 - exitProgress) * 0.4

    // Web strands growing from each letter
    const webGrowth = phase === 'enter' ? enterProgress : phase === 'hold' ? 1 : 1 - exitProgress
    const webStrands = Array.from({ length: 5 }, (_, i) => {
      const angle = -30 + i * 15
      const len = (20 + rand(seed + i * 7) * 30) * webGrowth
      const startX = -20 + (i / 4) * 40
      return (
        <div
          key={`web-${i}`}
          style={{
            position: 'absolute',
            left: `calc(50% + ${startX}px)`,
            top: '45%',
            width: 1,
            height: len,
            background: 'rgba(200, 200, 200, 0.12)',
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'top center',
          }}
        />
      )
    })

    return (
      <>
        {/* Thread from top */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: 1,
            height: `calc(50% + ${crawlOffset}px - 40px)`,
            background: 'rgba(200, 200, 200, 0.15)',
            opacity: threadOpacity,
            transform: 'translateX(-50%)',
          }}
        />
        {/* Web strands from text */}
        {webStrands}
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${crawlOffset}px))`,
            opacity: mainOpacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color,
            textShadow: `0 0 10px rgba(100, 100, 100, 0.3), 0 2px 4px rgba(0, 0, 0, 0.8)`,
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function SpiderCrawlComponent(props: MotionGraphicProps<SpiderCrawlConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spider-crawl',
  title: 'Kinetic Spider Crawl',
  description: 'Text hangs from spider threads with web strands growing, crawling spider in background, eerie arachnid horror theme',
  tags: ['kinetic', 'typography', 'horror', 'spider', 'web', 'creepy', 'dark', 'crawl'],
  category: 'captions',
  component: SpiderCrawlComponent as any,
  defaultConfig: {
    words: ['CRAWL', 'WEAVE', 'SNARE', 'LURK'],
    colors: ['#999988', '#AAAAAA', '#888877', '#777766'],
    bgColor: '#080808',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRAWL', 'WEAVE', 'SNARE', 'LURK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#999988', '#AAAAAA', '#888877', '#777766'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
