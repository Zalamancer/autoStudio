/**
 * SVG Animation Library
 *
 * Pre-built SVG animations that can be used directly without AI generation.
 * Each animation is a self-contained SVG+CSS HTML page rendered in an iframe.
 *
 * Categories:
 * - Loading / progress indicators
 * - Check marks / success indicators
 * - Arrows and pointers
 * - Transitions and wipes
 * - Ambient effects (floating, pulsing)
 * - Social media indicators
 */

// ── Types ──

export interface SVGAnimationEntry {
  id: string
  name: string
  category: SVGAnimationCategory
  tags: string[]
  /** Pre-built SVG+CSS HTML — ready to render in an iframe */
  html: string
  /** Preview thumbnail SVG (static) */
  previewSvg?: string
}

export type SVGAnimationCategory =
  | 'loading'
  | 'success'
  | 'arrow'
  | 'transition'
  | 'ambient'
  | 'social'
  | 'icon'

// ── Animation builder helpers ──

function svgPage(viewBox: string, style: string, body: string, bg = 'transparent'): string {
  return `<!DOCTYPE html><html><head><style>*{margin:0;padding:0}body{overflow:hidden;background:${bg}}svg{width:100%;height:100%;display:block}${style}</style></head><body><svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${body}</svg></body></html>`
}

// ── Library ──

export const SVG_ANIMATION_LIBRARY: SVGAnimationEntry[] = [
  // ── Loading animations ──
  {
    id: 'anim-spinner-dots',
    name: 'Dot Spinner',
    category: 'loading',
    tags: ['loading', 'spinner', 'dots', 'progress'],
    html: svgPage('0 0 100 100',
      `.dot{animation:dotPulse 1.2s ease-in-out infinite}.d1{animation-delay:0s}.d2{animation-delay:.15s}.d3{animation-delay:.3s}.d4{animation-delay:.45s}.d5{animation-delay:.6s}.d6{animation-delay:.75s}.d7{animation-delay:.9s}.d8{animation-delay:1.05s}@keyframes dotPulse{0%,80%,100%{opacity:.3;r:3}40%{opacity:1;r:5}}`,
      `<circle class="dot d1" cx="50" cy="15" r="3" fill="#6366f1"/><circle class="dot d2" cx="74" cy="26" r="3" fill="#6366f1"/><circle class="dot d3" cx="85" cy="50" r="3" fill="#6366f1"/><circle class="dot d4" cx="74" cy="74" r="3" fill="#6366f1"/><circle class="dot d5" cx="50" cy="85" r="3" fill="#6366f1"/><circle class="dot d6" cx="26" cy="74" r="3" fill="#6366f1"/><circle class="dot d7" cx="15" cy="50" r="3" fill="#6366f1"/><circle class="dot d8" cx="26" cy="26" r="3" fill="#6366f1"/>`)
  },
  {
    id: 'anim-spinner-ring',
    name: 'Ring Spinner',
    category: 'loading',
    tags: ['loading', 'spinner', 'ring', 'circle'],
    html: svgPage('0 0 100 100',
      `.ring{animation:spin 1s linear infinite;transform-origin:50% 50%;transform-box:fill-box}@keyframes spin{to{transform:rotate(360deg)}}`,
      `<circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" stroke-width="6"/><circle class="ring" cx="50" cy="50" r="38" fill="none" stroke="#6366f1" stroke-width="6" stroke-dasharray="80 160" stroke-linecap="round"/>`)
  },
  {
    id: 'anim-progress-bar',
    name: 'Progress Bar',
    category: 'loading',
    tags: ['loading', 'progress', 'bar'],
    html: svgPage('0 0 200 40',
      `.bar{animation:fillBar 2s ease-in-out infinite}@keyframes fillBar{0%{width:0}50%{width:180}100%{width:0}}`,
      `<rect x="10" y="12" width="180" height="16" rx="8" fill="#1f2937"/><rect class="bar" x="10" y="12" width="0" height="16" rx="8" fill="#6366f1"/>`)
  },
  {
    id: 'anim-pulse-circle',
    name: 'Pulse Circle',
    category: 'loading',
    tags: ['loading', 'pulse', 'circle', 'ripple'],
    html: svgPage('0 0 100 100',
      `.pulse{animation:pulseOut 1.5s ease-out infinite;transform-origin:50% 50%;transform-box:fill-box}.p2{animation-delay:.5s}.p3{animation-delay:1s}@keyframes pulseOut{0%{r:5;opacity:1}100%{r:40;opacity:0}}`,
      `<circle class="pulse" cx="50" cy="50" r="5" fill="none" stroke="#6366f1" stroke-width="2"/><circle class="pulse p2" cx="50" cy="50" r="5" fill="none" stroke="#6366f1" stroke-width="2"/><circle class="pulse p3" cx="50" cy="50" r="5" fill="none" stroke="#6366f1" stroke-width="2"/><circle cx="50" cy="50" r="5" fill="#6366f1"/>`)
  },

  // ── Success animations ──
  {
    id: 'anim-checkmark',
    name: 'Animated Checkmark',
    category: 'success',
    tags: ['check', 'success', 'done', 'complete'],
    html: svgPage('0 0 100 100',
      `.circle{animation:drawCircle .6s ease-out forwards;stroke-dasharray:220;stroke-dashoffset:220}.check{animation:drawCheck .4s ease-out .5s forwards;stroke-dasharray:50;stroke-dashoffset:50}@keyframes drawCircle{to{stroke-dashoffset:0}}@keyframes drawCheck{to{stroke-dashoffset:0}}`,
      `<circle class="circle" cx="50" cy="50" r="35" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round"/><path class="check" d="M30 50 L45 65 L70 38" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`)
  },
  {
    id: 'anim-thumbsup',
    name: 'Thumbs Up',
    category: 'success',
    tags: ['thumbs', 'up', 'like', 'approve'],
    html: svgPage('0 0 100 100',
      `.thumb{animation:thumbBounce .8s ease-out;transform-origin:50% 80%;transform-box:fill-box}@keyframes thumbBounce{0%{transform:scale(0) rotate(-20deg)}50%{transform:scale(1.2) rotate(5deg)}100%{transform:scale(1) rotate(0)}}`,
      `<g class="thumb"><path d="M40 65 L40 42 Q40 35 47 35 L55 35 L58 25 Q60 20 65 22 L67 23 Q70 24 69 28 L66 38 L75 38 Q80 38 80 43 L80 46 Q82 50 80 53 L79 55 Q80 58 78 61 L77 62 Q78 65 76 67 L75 68 Q76 70 74 72 L50 72 Q45 72 43 68 L40 65Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/></g>`)
  },

  // ── Arrow animations ──
  {
    id: 'anim-arrow-right',
    name: 'Animated Arrow Right',
    category: 'arrow',
    tags: ['arrow', 'right', 'next', 'pointer'],
    html: svgPage('0 0 200 100',
      `.arrow{animation:slideRight 1.5s ease-in-out infinite}@keyframes slideRight{0%,100%{transform:translateX(0);opacity:1}50%{transform:translateX(20px);opacity:.5}}`,
      `<g class="arrow"><line x1="40" y1="50" x2="150" y2="50" stroke="#6366f1" stroke-width="4" stroke-linecap="round"/><path d="M140 35 L160 50 L140 65" fill="none" stroke="#6366f1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`)
  },
  {
    id: 'anim-arrow-down',
    name: 'Animated Arrow Down',
    category: 'arrow',
    tags: ['arrow', 'down', 'scroll', 'pointer'],
    html: svgPage('0 0 100 150',
      `.arrow{animation:bounceDown 1.2s ease-in-out infinite}@keyframes bounceDown{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}}`,
      `<g class="arrow"><line x1="50" y1="30" x2="50" y2="110" stroke="#6366f1" stroke-width="4" stroke-linecap="round"/><path d="M35 100 L50 120 L65 100" fill="none" stroke="#6366f1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`)
  },
  {
    id: 'anim-arrow-circular',
    name: 'Circular Arrow (Refresh)',
    category: 'arrow',
    tags: ['arrow', 'refresh', 'circular', 'reload'],
    html: svgPage('0 0 100 100',
      `.spin{animation:rotate 2s linear infinite;transform-origin:50% 50%;transform-box:fill-box}@keyframes rotate{to{transform:rotate(360deg)}}`,
      `<g class="spin"><path d="M50 15 A35 35 0 1 1 20 35" fill="none" stroke="#6366f1" stroke-width="4" stroke-linecap="round"/><path d="M15 20 L20 35 L35 25" fill="none" stroke="#6366f1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`)
  },

  // ── Transition animations ──
  {
    id: 'anim-wipe-horizontal',
    name: 'Horizontal Wipe',
    category: 'transition',
    tags: ['transition', 'wipe', 'horizontal'],
    html: svgPage('0 0 200 100',
      `.wipe{animation:wipeRight 2s ease-in-out infinite}@keyframes wipeRight{0%{transform:translateX(-200px)}50%{transform:translateX(0)}100%{transform:translateX(200px)}}`,
      `<rect class="wipe" x="0" y="0" width="200" height="100" fill="#6366f1" opacity="0.8"/>`)
  },
  {
    id: 'anim-fade-in-out',
    name: 'Fade In/Out',
    category: 'transition',
    tags: ['transition', 'fade', 'opacity'],
    html: svgPage('0 0 200 100',
      `.fade{animation:fadeIO 3s ease-in-out infinite}@keyframes fadeIO{0%,100%{opacity:0}50%{opacity:1}}`,
      `<rect class="fade" x="0" y="0" width="200" height="100" fill="#6366f1"/>`)
  },

  // ── Ambient animations ──
  {
    id: 'anim-floating-shapes',
    name: 'Floating Shapes',
    category: 'ambient',
    tags: ['ambient', 'floating', 'shapes', 'background'],
    html: svgPage('0 0 400 300',
      `.f1{animation:float1 6s ease-in-out infinite}.f2{animation:float2 8s ease-in-out infinite}.f3{animation:float3 5s ease-in-out infinite}.f4{animation:float4 7s ease-in-out infinite}@keyframes float1{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-15px)}}@keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(-15px,20px)}}@keyframes float3{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,25px)}}@keyframes float4{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,-10px)}}`,
      `<circle class="f1" cx="80" cy="60" r="25" fill="#6366f1" opacity="0.15"/><rect class="f2" x="260" y="40" width="50" height="50" rx="10" fill="#ec4899" opacity="0.12" transform="rotate(30,285,65)"/><circle class="f3" cx="180" cy="220" r="35" fill="#10b981" opacity="0.1"/><polygon class="f4" points="330,200 360,260 300,260" fill="#f59e0b" opacity="0.12"/>`)
  },
  {
    id: 'anim-wave-lines',
    name: 'Wave Lines',
    category: 'ambient',
    tags: ['ambient', 'wave', 'lines', 'background', 'ocean'],
    html: svgPage('0 0 400 200',
      `.w1{animation:wave 4s ease-in-out infinite}.w2{animation:wave 5s ease-in-out infinite .5s}.w3{animation:wave 6s ease-in-out infinite 1s}@keyframes wave{0%,100%{transform:translateX(0)}50%{transform:translateX(15px)}}`,
      `<path class="w1" d="M0 100 Q50 70 100 100 Q150 130 200 100 Q250 70 300 100 Q350 130 400 100" fill="none" stroke="#6366f1" stroke-width="2" opacity="0.4"/><path class="w2" d="M0 120 Q50 90 100 120 Q150 150 200 120 Q250 90 300 120 Q350 150 400 120" fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.3"/><path class="w3" d="M0 140 Q50 110 100 140 Q150 170 200 140 Q250 110 300 140 Q350 170 400 140" fill="none" stroke="#a78bfa" stroke-width="2" opacity="0.2"/>`)
  },
  {
    id: 'anim-gradient-shift',
    name: 'Gradient Color Shift',
    category: 'ambient',
    tags: ['ambient', 'gradient', 'color', 'background'],
    html: svgPage('0 0 400 300',
      `.stop1{animation:colorShift1 6s ease-in-out infinite}.stop2{animation:colorShift2 6s ease-in-out infinite}@keyframes colorShift1{0%,100%{stop-color:#6366f1}33%{stop-color:#ec4899}66%{stop-color:#10b981}}@keyframes colorShift2{0%,100%{stop-color:#8b5cf6}33%{stop-color:#f59e0b}66%{stop-color:#06b6d4}}`,
      `<defs><linearGradient id="agrd" x1="0%" y1="0%" x2="100%" y2="100%"><stop class="stop1" offset="0%"/><stop class="stop2" offset="100%"/></linearGradient></defs><rect width="400" height="300" fill="url(#agrd)"/>`)
  },

  // ── Social media ──
  {
    id: 'anim-heart-beat',
    name: 'Heart Beat (Like)',
    category: 'social',
    tags: ['heart', 'like', 'love', 'social'],
    html: svgPage('0 0 100 100',
      `.heart{animation:heartBeat 1s ease-in-out infinite;transform-origin:50% 55%;transform-box:fill-box}@keyframes heartBeat{0%,100%{transform:scale(1)}15%{transform:scale(1.25)}30%{transform:scale(1)}45%{transform:scale(1.15)}60%{transform:scale(1)}}`,
      `<path class="heart" d="M50 80 L25 55 Q10 40 25 25 Q40 10 50 30 Q60 10 75 25 Q90 40 75 55 Z" fill="#ef4444"/>`)
  },
  {
    id: 'anim-notification-bell',
    name: 'Notification Bell',
    category: 'social',
    tags: ['bell', 'notification', 'alert', 'social'],
    html: svgPage('0 0 100 100',
      `.bell{animation:ring .5s ease-in-out infinite alternate;transform-origin:50% 20%;transform-box:fill-box}@keyframes ring{0%{transform:rotate(-10deg)}100%{transform:rotate(10deg)}}`,
      `<g class="bell"><path d="M50 20 L50 25 Q35 30 32 45 L30 65 L70 65 L68 45 Q65 30 50 25Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/><rect x="28" y="65" width="44" height="5" rx="2" fill="#fbbf24"/><circle cx="50" cy="75" r="5" fill="#fbbf24"/><circle cx="50" cy="18" r="3" fill="#fbbf24"/></g><circle cx="68" cy="25" r="8" fill="#ef4444"/><text x="68" y="29" text-anchor="middle" fill="white" font-size="10" font-weight="700" font-family="system-ui">3</text>`)
  },

  // ── Icon animations ──
  {
    id: 'anim-play-button',
    name: 'Play Button Pulse',
    category: 'icon',
    tags: ['play', 'button', 'video', 'media'],
    html: svgPage('0 0 100 100',
      `.bg{animation:bgPulse 2s ease-in-out infinite}@keyframes bgPulse{0%,100%{r:35;opacity:.2}50%{r:40;opacity:.1}}`,
      `<circle class="bg" cx="50" cy="50" r="35" fill="#6366f1"/><circle cx="50" cy="50" r="30" fill="#6366f1"/><polygon points="42,35 42,65 68,50" fill="white"/>`)
  },
  {
    id: 'anim-location-pin',
    name: 'Location Pin Bounce',
    category: 'icon',
    tags: ['location', 'pin', 'map', 'marker'],
    html: svgPage('0 0 100 120',
      `.pin{animation:pinBounce 1.5s ease-in-out infinite;transform-origin:50% 100%}.shadow{animation:shadowPulse 1.5s ease-in-out infinite;transform-origin:50% 50%;transform-box:fill-box}@keyframes pinBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes shadowPulse{0%,100%{rx:20;opacity:.3}50%{rx:15;opacity:.15}}`,
      `<ellipse class="shadow" cx="50" cy="100" rx="20" ry="5" fill="#000" opacity="0.3"/><g class="pin"><path d="M50 15 Q25 15 25 40 Q25 60 50 85 Q75 60 75 40 Q75 15 50 15Z" fill="#ef4444"/><circle cx="50" cy="38" r="10" fill="white"/></g>`)
  },
]

// ── Search / filter functions ──

export function searchAnimations(query: string): SVGAnimationEntry[] {
  const q = query.toLowerCase().trim()
  if (!q) return SVG_ANIMATION_LIBRARY

  return SVG_ANIMATION_LIBRARY.filter((entry) =>
    entry.name.toLowerCase().includes(q) ||
    entry.tags.some((t) => t.includes(q)) ||
    entry.category.includes(q)
  )
}

export function getAnimationsByCategory(category: SVGAnimationCategory): SVGAnimationEntry[] {
  return SVG_ANIMATION_LIBRARY.filter((e) => e.category === category)
}

export function getAnimationById(id: string): SVGAnimationEntry | undefined {
  return SVG_ANIMATION_LIBRARY.find((e) => e.id === id)
}

export function getAnimationCategories(): { id: SVGAnimationCategory; label: string; count: number }[] {
  const counts = new Map<SVGAnimationCategory, number>()
  for (const e of SVG_ANIMATION_LIBRARY) {
    counts.set(e.category, (counts.get(e.category) || 0) + 1)
  }
  const labels: Record<SVGAnimationCategory, string> = {
    loading: 'Loading & Progress',
    success: 'Success & Feedback',
    arrow: 'Arrows & Pointers',
    transition: 'Transitions',
    ambient: 'Ambient & Background',
    social: 'Social Media',
    icon: 'Icon Animations',
  }
  return Array.from(counts.entries()).map(([id, count]) => ({
    id,
    label: labels[id] || id,
    count,
  }))
}
