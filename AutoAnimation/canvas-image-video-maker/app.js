// Canvas Image Video Maker - vanilla JS, zero dependencies.
// Search Pixabay, drop images on a canvas, set durations, export as video.
// AI Bundle: Gemini plans a storyboard, Pixabay fills it in, one coherent style.

'use strict'

const GEMINI_MODEL = 'gemini-3-flash-preview'
const GEMINI_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash-001']

// ElevenLabs TTS: all female, enthusiastic and natural. Tried in order; if a
// voice_id is retired or not on the account, the next one is used.
const ELEVENLABS = {
  voices: [
    { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' }, // upbeat social-media
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' }, // confident young female
    { id: 'EXAVITQu4vr4xnSDxMaC', name: 'Sarah' }, // warm young female
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' }, // classic reliable female
  ],
  model: 'eleven_multilingual_v2',
  settings: {
    stability: 0.35, // lower = more expressive / varied inflection
    similarity_boost: 0.8,
    style: 0.65, // higher = more emotion / enthusiasm
    use_speaker_boost: true,
  },
}
let _activeVoice = ELEVENLABS.voices[0]

const $ = (id) => document.getElementById(id)
const canvas = $('canvas')
const ctx = canvas.getContext('2d')
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

const state = {
  library: [],
  clips: [],
  selectedClip: null,
  currentTime: 0,
  playing: false,
  bgColor: '#000000',
  captionsEnabled: true,
  audio: null, // HTMLAudioElement with the ElevenLabs voiceover
  audioUrl: null, // object URL for the current VO blob
  // Characters that overlay the canvas during playback. Each character holds
  // one or more named frame sequences ("animations"). When the voiceover is
  // playing, an animation matching /^(talk|speak)/i is auto-selected so the
  // character looks like it's speaking; otherwise the user-picked active
  // animation plays. Frames cycle on a real-time clock so previews animate
  // even while the timeline is paused.
  characters: [],
  currentTab: 'library',
}

// Anchor presets for placing the character on the canvas. (x, y) is the anchor
// point in 0-1 canvas coords; (ax, ay) is the alignment of the character's
// bounding box relative to that point (0 = left/top, 1 = right/bottom).
const CHARACTER_POSITIONS = {
  'bottom-right': { label: 'Bottom right', x: 0.98, y: 0.98, ax: 1, ay: 1 },
  'bottom-left': { label: 'Bottom left', x: 0.02, y: 0.98, ax: 0, ay: 1 },
  'bottom-center': { label: 'Bottom center', x: 0.5, y: 0.98, ax: 0.5, ay: 1 },
  'top-right': { label: 'Top right', x: 0.98, y: 0.02, ax: 1, ay: 0 },
  'top-left': { label: 'Top left', x: 0.02, y: 0.02, ax: 0, ay: 0 },
  center: { label: 'Center', x: 0.5, y: 0.5, ax: 0.5, ay: 0.5 },
}

// Microlink: free tier, ~50 req/day/IP. Returns a CORS-safe screenshot URL,
// which is critical because canvas.captureStream would taint the stream
// otherwise and block the MP4 export.
const MICROLINK_ENDPOINT = 'https://api.microlink.io/'

// Transient UI state for click-drag highlighting on the main canvas. Only one
// article clip can be in edit mode at a time. All coordinates are in canvas
// pixels during the drag; we convert to 0-1 screenshot coords on pointer-up.
const highlightEdit = {
  clipId: null,
  dragging: false,
  startX: 0,
  startY: 0,
  curX: 0,
  curY: 0,
}

function getKey(name) {
  const baked = (typeof window !== 'undefined' && window.__KEYS__) || {}
  if (baked[name]) return baked[name]
  try {
    return localStorage.getItem(name + 'Key') || ''
  } catch {
    return ''
  }
}

// TikTok/Reels-style caption config.
const CAPTION = {
  chunkSize: 3,
  yRatio: 2 / 3,
  fontSizeRatio: 0.04, // font size as a fraction of canvas height (vertical canvas)
  fontSizeRatioByWidth: 0.075, // or as a fraction of canvas width; we use the larger
  maxWidthRatio: 0.86,
  colorBase: '#FFFFFF',
  colorActive: '#000000',
  colorStroke: '#000000',
  colorPill: '#FFEC3D',
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
}

// Image-frame presets. Each value is {x, y, w, h} as 0-1 ratios of the canvas,
// plus a fit mode: "cover" crops to fill the rect, "contain" fits inside it.
const LAYOUTS = {
  fullscreen: { label: 'Fullscreen', x: 0, y: 0, w: 1, h: 1, fit: 'cover' },
  fit: { label: 'Fit (letterbox)', x: 0, y: 0, w: 1, h: 1, fit: 'contain' },
  'top-half': { label: 'Top half', x: 0, y: 0, w: 1, h: 0.5, fit: 'cover' },
  'bottom-half': { label: 'Bottom half', x: 0, y: 0.5, w: 1, h: 0.5, fit: 'cover' },
  'center-band': { label: 'Center band', x: 0, y: 0.25, w: 1, h: 0.5, fit: 'cover' },
  'top-card': { label: 'Top card', x: 0.08, y: 0.08, w: 0.84, h: 0.44, fit: 'cover' },
  'bottom-card': { label: 'Bottom card', x: 0.08, y: 0.48, w: 0.84, h: 0.44, fit: 'cover' },
  'center-card': { label: 'Center card', x: 0.08, y: 0.28, w: 0.84, h: 0.44, fit: 'cover' },
}

// Per-clip motion presets. Keys used in UI + AI prompt.
const ANIMATIONS = {
  none: { label: 'None' },
  'slide-from-left': { label: 'Slide from left' },
  'slide-from-right': { label: 'Slide from right' },
  'slide-from-top': { label: 'Slide from top' },
  'slide-from-bottom': { label: 'Slide from bottom' },
  pop: { label: 'Pop' },
  shake: { label: 'Shake' },
  hover: { label: 'Slow hover (Ken Burns)' },
  'zoom-in': { label: 'Zoom in' },
  'zoom-out': { label: 'Zoom out' },
}

// --------------------------- Pixabay ---------------------------

function renderLibrary(hits) {
  state.library = hits
  const grid = $('library')
  grid.innerHTML = ''
  for (const hit of hits) {
    const img = document.createElement('img')
    img.src = hit.previewURL
    img.title = hit.tags
    img.loading = 'lazy'
    img.addEventListener('click', () => addClipFromPixabay(hit))
    grid.appendChild(img)
  }
}

async function pixabayFirstHit(query, pixabayKey) {
  const hits = await pixabayTopHits(query, pixabayKey, 5)
  return hits[0] || null
}

async function pixabayTopHits(query, pixabayKey, perPage = 20) {
  if (!query) return []
  const orientation = canvas.height > canvas.width ? 'vertical' : 'horizontal'
  const url =
    `https://pixabay.com/api/?key=${encodeURIComponent(pixabayKey)}` +
    `&q=${encodeURIComponent(query)}` +
    `&image_type=photo&safesearch=true&order=popular` +
    `&per_page=${Math.max(3, Math.min(perPage, 200))}` +
    `&orientation=${orientation}`
  try {
    const r = await fetch(url)
    if (!r.ok) return []
    const d = await r.json()
    return d.hits || []
  } catch {
    return []
  }
}

// --------------------------- Article screenshots (Microlink) ---------------------------

// iad.microlink.io serves screenshots from a CDN that doesn't always send
// Access-Control-Allow-Origin. Without CORS, loading with crossOrigin='anonymous'
// fails AND drawing without crossOrigin taints the canvas - which then makes
// captureStream produce blank frames during MP4 export. So every screenshot
// URL has to go through a CORS-clean proxy.
//
// We try the local Express server first (fastest, most reliable when running),
// then fall back to public proxies. The first one that returns ANY HTTP
// response wins and is cached for the rest of the session - so subsequent
// screenshots in the same News run all use the same proxy.
const LOCAL_PROXY = 'http://localhost:3001/api/microlink-proxy?url='
const PUBLIC_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
]

let _cachedProxy = null

async function pickWorkingProxy() {
  if (_cachedProxy) return _cachedProxy

  // Use a known-bad URL so we don't fetch a real screenshot just to test.
  // A 400/404 from the proxy still proves it's reachable and CORS-clean.
  const TEST = 'https://iad.microlink.io/_proxy_alive_check_.png'
  const candidates = [LOCAL_PROXY, ...PUBLIC_PROXIES]

  for (const proxy of candidates) {
    try {
      const res = await fetch(proxy + encodeURIComponent(TEST), { mode: 'cors' })
      if (res.status >= 200 && res.status < 600) {
        _cachedProxy = proxy
        console.log('[proxy] using', proxy)
        return proxy
      }
    } catch (_) {
      /* network/CORS failure - try next */
    }
  }
  // None reachable. Cache the first public one anyway so the calling code
  // produces a useful image.onerror later instead of hanging forever.
  _cachedProxy = PUBLIC_PROXIES[0]
  return _cachedProxy
}

// Synchronous wrapper - assumes pickWorkingProxy has been awaited at least
// once this session. Used by the rendering / Vision paths that already
// have the URL in hand.
const corsProxy = (url) => (_cachedProxy || PUBLIC_PROXIES[0]) + encodeURIComponent(url)

function makeClipArticle(shotUrl, sourceUrl) {
  let host = ''
  try {
    host = new URL(sourceUrl).hostname.replace(/^www\./, '')
  } catch {}
  return {
    id: Math.random().toString(36).slice(2, 9),
    kind: 'article',
    image: null,
    src: shotUrl,
    preview: shotUrl,
    sourceUrl,
    sourceHost: host,
    start: totalDuration(),
    duration: 6,
    caption: '',
    // layout/animation are ignored for article clips; kept so other code paths
    // that read them don't break.
    layout: 'fullscreen',
    animation: 'none',
    // {x, y, w, h} in 0-1 normalized screenshot coords. When set, playback
    // pans to center the highlight and vignettes everything else.
    highlight: null,
    // Manual scroll offset (canvas pixels, <= 0) used while editing highlight.
    _editScrollY: 0,
    loading: true,
  }
}

function addClipFromArticle(shotUrl, sourceUrl) {
  return new Promise((resolve, reject) => {
    const clip = makeClipArticle(shotUrl, sourceUrl)
    state.clips.push(clip)
    state.selectedClip = clip
    renderClipsList()
    draw()

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      clip.image = image
      clip.loading = false
      draw()
      renderClipsList()
      resolve()
    }
    image.onerror = () => {
      state.clips = state.clips.filter((c) => c.id !== clip.id)
      if (state.selectedClip === clip) state.selectedClip = state.clips[0] || null
      recomputeStarts()
      renderClipsList()
      draw()
      reject(new Error('Screenshot failed to load (CORS proxy or upstream rejected the URL).'))
    }
    image.src = shotUrl
  })
}

// --------------------------- AI Bundle ---------------------------

async function callGemini(prompt, apiKey) {
  const models = [GEMINI_MODEL, ...GEMINI_FALLBACKS]
  let lastErr = null
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.9 },
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text
      lastErr = new Error('Gemini returned no text.')
      continue
    }
    if (res.status === 404) {
      lastErr = new Error(`Model ${model} not found.`)
      continue
    }
    const body = await res.text()
    throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  throw lastErr || new Error('All Gemini models failed.')
}

function parseAIPlan(text) {
  try {
    return JSON.parse(text)
  } catch {}
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('Could not parse AI response as JSON.')
  return JSON.parse(m[0])
}

async function aiBundle(concept) {
  const geminiKey = $('geminiKey').value.trim()
  const pixabayKey = $('apiKey').value.trim()
  if (!pixabayKey) {
    alert('Paste a Pixabay API key in the top bar first.')
    return
  }
  if (!geminiKey) {
    alert('Paste a Gemini API key in the top bar.\nGet one free at https://aistudio.google.com/apikey')
    return
  }

  const btn = $('generateBtn')
  btn.disabled = true
  btn.textContent = 'Planning...'

  try {
    const layoutOptions = Object.keys(LAYOUTS).join(', ')
    const animationOptions = Object.keys(ANIMATIONS).join(', ')

    const prompt = `You are a stock-footage storyboard planner for a 9:16 vertical short (TikTok/Reels) with karaoke captions.

Concept: "${concept}"

STEP 1 - identify the CONTEXT of the concept before writing any shots. Pick
2 to 4 short anchor words that describe the setting/domain/subject type.
Examples:
- "a kid's first day at school" -> context_anchors: ["school", "kid", "classroom", "student"]
- "mountain hiking in japan"    -> context_anchors: ["hiking", "mountain", "japan", "forest"]
- "cafe latte art tutorial"     -> context_anchors: ["cafe", "barista", "coffee", "latte"]

STEP 2 - plan 6 to 10 shots. For each shot write TWO short Pixabay queries
(primary + alt) so we have a fallback if the primary returns stale hits.

CRITICAL query rules:
- Keep each query SHORT: 2 or 3 words max. Longer = fewer Pixabay matches.
- Include ONE context anchor per query (not all of them).
- Use DIFFERENT anchors or different nouns between primary and alt so the
  two queries don't return the same result set.
- Use DIFFERENT subjects across shots (different nouns) so we don't get
  duplicate images.

Examples:
- NOT "backpack" -> YES primary:"school backpack", alt:"kid backpack"
- NOT "lunch box" -> YES primary:"school lunchbox", alt:"kids lunch"
- NOT "hair"     -> YES primary:"kid smiling", alt:"student portrait"

Also keep the VISUAL style consistent across shots (same time of day, color
palette, mood, framing). The result should feel like one video.

For EACH shot, choose:
- query: 2 or 3 words, with one context_anchor. The primary Pixabay search.
- query_alt: 2 or 3 words, with a DIFFERENT anchor or synonym. Fallback.
- duration: 2.0 to 4.0 seconds
- caption: 3 to 8 word narration chunk (the shot's VO line). Concatenated in
  order, all captions should read like one coherent 30-60 word narration.
- layout: one of [${layoutOptions}].
- animation: one of [${animationOptions}].

Use VARIETY across shots for layout and animation - don't pick the same one
every time. Match each choice to the mood of that shot (e.g. "pop" for punch
lines, "hover" for scenic beats, "shake" for tension, "slide-from-right" for
reveals, "top-card"/"bottom-card" for moments that pair with big captions).

Return RAW JSON only (no markdown fences, no prose) in this exact shape:
{
  "style_note": "one sentence describing the consistent visual style",
  "context_anchors": ["word1", "word2", "word3"],
  "shots": [
    { "query": "short context query", "query_alt": "short alt query",
      "duration": 3.0, "caption": "...", "layout": "fullscreen", "animation": "hover" }
  ]
}

Before returning, scan shot queries and change any duplicate subjects so
every shot has a distinct noun.

Captions must be lowercase-friendly, no trailing punctuation, no hashtags, no emoji.`

    const text = await callGemini(prompt, geminiKey)
    const plan = parseAIPlan(text)
    const shots = (Array.isArray(plan.shots) ? plan.shots : []).slice(0, 12)
    if (shots.length === 0) throw new Error('AI returned no shots.')

    // Pull context anchors (fall back to the concept itself if missing).
    const anchors = (Array.isArray(plan.context_anchors) ? plan.context_anchors : [])
      .map((a) => (typeof a === 'string' ? a.trim().toLowerCase() : ''))
      .filter(Boolean)
    if (anchors.length === 0) {
      // Use the first concept word as a minimum anchor so Pixabay stays in-theme.
      const first = concept.split(/\s+/)[0]
      if (first) anchors.push(first.toLowerCase())
    }
    console.log('[AI] context anchors:', anchors)

    const styleEl = $('styleNote')
    if (plan.style_note) {
      styleEl.textContent = 'Style: ' + plan.style_note
      styleEl.hidden = false
    } else {
      styleEl.hidden = true
    }

    btn.textContent = 'Fetching...'

    // Safety net: if the AI slipped and returned a query without any anchor,
    // prepend the first anchor so Pixabay stays in context.
    const anchorQuery = (q) => {
      if (!q) return ''
      const lower = q.toLowerCase()
      const hasAnchor = anchors.some((a) => lower.includes(a))
      if (hasAnchor || anchors.length === 0) return q
      return `${anchors[0]} ${q}`.trim()
    }

    // Fetch candidate pools for every shot in parallel. Each pool holds the
    // top-20 Pixabay hits for the primary + alt + anchor-only queries, so
    // we have plenty of material to pick from when deduping.
    const pools = await Promise.all(
      shots.map(async (shot) => {
        const primary = anchorQuery(shot.query)
        const alt = anchorQuery(shot.query_alt)
        const anchorOnly = anchors[0] || ''
        const queryList = [primary, alt, anchorOnly].filter((q, i, a) => q && a.indexOf(q) === i)
        const candidateSets = await Promise.all(queryList.map((q) => pixabayTopHits(q, pixabayKey, 20)))
        return { shot, queryList, candidateSets }
      }),
    )

    // Pick a unique hit for each shot, sequentially so we can track used ids.
    const usedIds = new Set()
    const hits = pools.map(({ shot, queryList, candidateSets }) => {
      let picked = null
      let pickedQuery = queryList[0] || ''
      for (let qi = 0; qi < candidateSets.length && !picked; qi++) {
        for (const hit of candidateSets[qi]) {
          if (!usedIds.has(hit.id)) {
            usedIds.add(hit.id)
            picked = hit
            pickedQuery = queryList[qi]
            break
          }
        }
      }
      if (!picked) console.warn('[shot] no unique image for', queryList)
      return {
        hit: picked,
        duration: clamp(parseFloat(shot.duration) || 3, 0.5, 10),
        query: pickedQuery,
        caption: typeof shot.caption === 'string' ? shot.caption.trim() : '',
        layout: typeof shot.layout === 'string' && LAYOUTS[shot.layout] ? shot.layout : 'fullscreen',
        animation: typeof shot.animation === 'string' && ANIMATIONS[shot.animation] ? shot.animation : 'none',
      }
    })

    stop()
    state.clips = []
    state.selectedClip = null
    state.currentTime = 0

    for (const r of hits) {
      if (!r.hit) continue
      await addClipFromPixabayAsync(r.hit, r.duration, r.caption, r.layout, r.animation)
    }
    recomputeStarts()
    if (state.clips.length) state.selectedClip = state.clips[0]
    renderClipsList()
    draw()

    const libraryHits = hits.filter((r) => r.hit).map((r) => r.hit)
    if (libraryHits.length) {
      renderLibrary(libraryHits)
      $('libraryHint').style.display = 'none'
    }

    if (!state.clips.length) {
      alert('Pixabay returned no images for any of the AI-planned queries. Try a different concept.')
    }
  } catch (err) {
    alert('AI Bundle failed: ' + err.message)
    throw err
  } finally {
    btn.disabled = false
  }
}

function makeClip(hit, { duration = 3, caption = '', layout = 'fullscreen', animation = 'none' } = {}) {
  return {
    id: Math.random().toString(36).slice(2, 9),
    image: null,
    src: hit.largeImageURL,
    preview: hit.previewURL,
    start: totalDuration(),
    duration,
    caption,
    layout: LAYOUTS[layout] ? layout : 'fullscreen',
    animation: ANIMATIONS[animation] ? animation : 'none',
    loading: true,
  }
}

function addClipFromPixabayAsync(hit, duration, caption, layout, animation) {
  return new Promise((resolve) => {
    const clip = makeClip(hit, { duration, caption, layout, animation })
    state.clips.push(clip)

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      clip.image = image
      clip.loading = false
      resolve()
    }
    image.onerror = () => {
      state.clips = state.clips.filter((c) => c.id !== clip.id)
      resolve()
    }
    image.src = hit.largeImageURL
  })
}

// --------------------------- Clips ---------------------------

function addClipFromPixabay(hit) {
  const clip = makeClip(hit)
  state.clips.push(clip)
  state.selectedClip = clip
  renderClipsList()
  draw()

  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.onload = () => {
    clip.image = image
    clip.loading = false
    draw()
  }
  image.onerror = () => {
    alert(
      'Could not load that image. Try a different one, or serve this folder via a local server (e.g. `python3 -m http.server`) to avoid file:// CORS issues.',
    )
    state.clips = state.clips.filter((c) => c.id !== clip.id)
    recomputeStarts()
    renderClipsList()
    draw()
  }
  image.src = hit.largeImageURL
}

function totalDuration() {
  return state.clips.reduce((sum, c) => sum + c.duration, 0)
}

function recomputeStarts() {
  let t = 0
  for (const c of state.clips) {
    c.start = t
    t += c.duration
  }
}

function moveClip(index, delta) {
  const target = index + delta
  if (target < 0 || target >= state.clips.length) return
  const [clip] = state.clips.splice(index, 1)
  state.clips.splice(target, 0, clip)
  recomputeStarts()
  renderClipsList()
  draw()
}

function renderClipsList() {
  const list = $('clips')
  list.innerHTML = ''
  $('clipsHint').style.display = state.clips.length ? 'none' : ''

  state.clips.forEach((clip, i) => {
    const li = document.createElement('li')
    li.className = 'clip' + (clip === state.selectedClip ? ' selected' : '')
    li.addEventListener('click', () => {
      state.selectedClip = clip
      renderClipsList()
      draw()
    })

    if (clip.kind === 'article') {
      renderArticleClipRow(li, clip, i)
      list.appendChild(li)
      return
    }

    const img = document.createElement('img')
    img.src = clip.preview

    const meta = document.createElement('div')
    meta.className = 'meta'

    const capLabel = document.createElement('label')
    capLabel.textContent = 'Caption'
    const capInput = document.createElement('input')
    capInput.type = 'text'
    capInput.placeholder = 'few words, no punctuation'
    capInput.value = clip.caption || ''
    capInput.addEventListener('click', (e) => e.stopPropagation())
    capInput.addEventListener('input', (e) => {
      clip.caption = e.target.value
      draw()
    })

    const selectRow = document.createElement('div')
    selectRow.className = 'clip-selects'

    const layoutSelect = document.createElement('select')
    for (const [key, def] of Object.entries(LAYOUTS)) {
      const opt = document.createElement('option')
      opt.value = key
      opt.textContent = def.label
      if (clip.layout === key) opt.selected = true
      layoutSelect.appendChild(opt)
    }
    layoutSelect.addEventListener('click', (e) => e.stopPropagation())
    layoutSelect.addEventListener('change', (e) => {
      clip.layout = e.target.value
      draw()
    })

    const animSelect = document.createElement('select')
    for (const [key, def] of Object.entries(ANIMATIONS)) {
      const opt = document.createElement('option')
      opt.value = key
      opt.textContent = def.label
      if (clip.animation === key) opt.selected = true
      animSelect.appendChild(opt)
    }
    animSelect.addEventListener('click', (e) => e.stopPropagation())
    animSelect.addEventListener('change', (e) => {
      clip.animation = e.target.value
      draw()
    })

    selectRow.append(layoutSelect, animSelect)

    const durLabel = document.createElement('label')
    durLabel.textContent = 'Duration (s)'
    const durInput = document.createElement('input')
    durInput.type = 'number'
    durInput.min = '0.1'
    durInput.step = '0.1'
    durInput.value = String(clip.duration)
    durInput.addEventListener('click', (e) => e.stopPropagation())
    durInput.addEventListener('input', (e) => {
      clip.duration = Math.max(0.1, parseFloat(e.target.value) || 0.1)
      recomputeStarts()
      updateTimeLabel()
    })

    meta.append(capLabel, capInput, selectRow, durLabel, durInput)

    const actions = document.createElement('div')
    actions.className = 'actions'
    const upBtn = document.createElement('button')
    upBtn.type = 'button'
    upBtn.title = 'Move up'
    upBtn.textContent = '^'
    upBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      moveClip(i, -1)
    })
    const downBtn = document.createElement('button')
    downBtn.type = 'button'
    downBtn.title = 'Move down'
    downBtn.textContent = 'v'
    downBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      moveClip(i, 1)
    })
    const rmBtn = document.createElement('button')
    rmBtn.type = 'button'
    rmBtn.className = 'remove'
    rmBtn.title = 'Remove'
    rmBtn.textContent = '×'
    rmBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      state.clips = state.clips.filter((c) => c.id !== clip.id)
      if (state.selectedClip === clip) state.selectedClip = state.clips[0] || null
      recomputeStarts()
      renderClipsList()
      draw()
    })
    actions.append(upBtn, downBtn, rmBtn)

    li.append(img, meta, actions)
    list.appendChild(li)
  })

  updateTimeLabel()
}

// Separate row renderer for article clips: yellow badge, caption, highlight
// controls, duration, and the standard up/down/remove buttons. No layout or
// animation selects because article clips have their own scroll-based motion.
function renderArticleClipRow(li, clip, i) {
  const badge = document.createElement('div')
  badge.className = 'article-clip-badge'
  if (clip.preview) {
    const thumb = document.createElement('img')
    thumb.src = clip.preview
    thumb.alt = ''
    badge.appendChild(thumb)
  }
  const label = document.createElement('span')
  label.textContent = 'ARTICLE'
  badge.appendChild(label)

  const meta = document.createElement('div')
  meta.className = 'meta'

  if (clip.sourceHost) {
    const hostLabel = document.createElement('label')
    hostLabel.textContent = clip.sourceHost
    hostLabel.style.textTransform = 'none'
    hostLabel.style.letterSpacing = '0'
    hostLabel.style.color = '#ffec3d'
    hostLabel.style.fontSize = '10px'
    meta.appendChild(hostLabel)
  }

  const capLabel = document.createElement('label')
  capLabel.textContent = 'Caption'
  const capInput = document.createElement('input')
  capInput.type = 'text'
  capInput.placeholder = 'voiceover line for this clip'
  capInput.value = clip.caption || ''
  capInput.addEventListener('click', (e) => e.stopPropagation())
  capInput.addEventListener('input', (e) => {
    clip.caption = e.target.value
    draw()
  })

  const hlRow = document.createElement('div')
  hlRow.className = 'highlight-actions'
  const editBtn = document.createElement('button')
  editBtn.type = 'button'
  const editing = highlightEdit.clipId === clip.id
  editBtn.textContent = editing ? 'Done' : clip.highlight ? 'Edit highlight' : 'Set highlight'
  if (editing) editBtn.classList.add('active')
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleHighlightEdit(clip)
  })
  const clearBtn = document.createElement('button')
  clearBtn.type = 'button'
  clearBtn.className = 'clear'
  clearBtn.textContent = 'Clear'
  clearBtn.disabled = !clip.highlight
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    clip.highlight = null
    if (highlightEdit.clipId === clip.id) exitHighlightEdit()
    renderClipsList()
    draw()
  })
  hlRow.append(editBtn, clearBtn)

  const durLabel = document.createElement('label')
  durLabel.textContent = 'Duration (s)'
  const durInput = document.createElement('input')
  durInput.type = 'number'
  durInput.min = '0.5'
  durInput.step = '0.1'
  durInput.value = String(clip.duration)
  durInput.addEventListener('click', (e) => e.stopPropagation())
  durInput.addEventListener('input', (e) => {
    clip.duration = Math.max(0.5, parseFloat(e.target.value) || 0.5)
    recomputeStarts()
    updateTimeLabel()
  })

  meta.append(capLabel, capInput, hlRow, durLabel, durInput)

  const actions = document.createElement('div')
  actions.className = 'actions'
  const upBtn = document.createElement('button')
  upBtn.type = 'button'
  upBtn.title = 'Move up'
  upBtn.textContent = '^'
  upBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    moveClip(i, -1)
  })
  const downBtn = document.createElement('button')
  downBtn.type = 'button'
  downBtn.title = 'Move down'
  downBtn.textContent = 'v'
  downBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    moveClip(i, 1)
  })
  const rmBtn = document.createElement('button')
  rmBtn.type = 'button'
  rmBtn.className = 'remove'
  rmBtn.title = 'Remove'
  rmBtn.textContent = '×'
  rmBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (highlightEdit.clipId === clip.id) exitHighlightEdit()
    state.clips = state.clips.filter((c) => c.id !== clip.id)
    if (state.selectedClip === clip) state.selectedClip = state.clips[0] || null
    recomputeStarts()
    renderClipsList()
    draw()
  })
  actions.append(upBtn, downBtn, rmBtn)

  li.append(badge, meta, actions)
}

function toggleHighlightEdit(clip) {
  if (highlightEdit.clipId === clip.id) exitHighlightEdit()
  else enterHighlightEdit(clip)
}

function enterHighlightEdit(clip) {
  if (!clip.image) return
  stop()
  highlightEdit.clipId = clip.id
  highlightEdit.dragging = false
  state.selectedClip = clip
  // Seed the manual scroll position: if a highlight already exists, scroll so
  // it's centered; otherwise start at the top of the article.
  const drawH = (clip.image.height / clip.image.width) * canvas.width
  if (clip.highlight && drawH > canvas.height) {
    const hCenterDrawY = (clip.highlight.y + clip.highlight.h / 2) * drawH
    const target = canvas.height / 2 - hCenterDrawY
    clip._editScrollY = Math.max(canvas.height - drawH, Math.min(0, target))
  } else {
    clip._editScrollY = 0
  }
  canvas.classList.add('highlight-editing')
  renderClipsList()
  draw()
}

function exitHighlightEdit() {
  highlightEdit.clipId = null
  highlightEdit.dragging = false
  canvas.classList.remove('highlight-editing')
  renderClipsList()
  draw()
}

// --------------------------- Rendering ---------------------------

function activeClip(time) {
  for (const c of state.clips) {
    if (time >= c.start && time < c.start + c.duration) return c
  }
  return state.clips[state.clips.length - 1] || null
}

// Resolve a clip's target rect from its layout preset (in canvas pixels).
function layoutRect(clip) {
  const def = LAYOUTS[clip.layout] || LAYOUTS.fullscreen
  return {
    x: def.x * canvas.width,
    y: def.y * canvas.height,
    w: def.w * canvas.width,
    h: def.h * canvas.height,
    fit: def.fit,
  }
}

// Compute per-frame animation transform: extra scale (on top of layout fit)
// plus translation in canvas pixels. t is localTime in seconds.
function animationTransform(clip, localTime) {
  const anim = clip.animation || 'none'
  const dur = Math.max(0.01, clip.duration)
  const p = clamp(localTime / dur, 0, 1)
  const easeOut = (x) => 1 - Math.pow(1 - x, 3)

  let scale = 1,
    dx = 0,
    dy = 0

  if (anim === 'slide-from-left') {
    const k = 1 - easeOut(Math.min(1, p / 0.3))
    dx = -canvas.width * k
  } else if (anim === 'slide-from-right') {
    const k = 1 - easeOut(Math.min(1, p / 0.3))
    dx = canvas.width * k
  } else if (anim === 'slide-from-top') {
    const k = 1 - easeOut(Math.min(1, p / 0.3))
    dy = -canvas.height * k
  } else if (anim === 'slide-from-bottom') {
    const k = 1 - easeOut(Math.min(1, p / 0.3))
    dy = canvas.height * k
  } else if (anim === 'pop') {
    const q = Math.min(1, p / 0.35)
    const c1 = 1.70158,
      c3 = c1 + 1
    const e = 1 + c3 * Math.pow(q - 1, 3) + c1 * Math.pow(q - 1, 2)
    scale = Math.max(0.01, e)
  } else if (anim === 'shake') {
    const amp = Math.min(canvas.width, canvas.height) * 0.012
    dx = Math.sin(localTime * 22) * amp
    dy = Math.cos(localTime * 27) * amp * 0.7
  } else if (anim === 'hover') {
    // Slow ken-burns: gentle zoom + subtle pan for the full duration.
    scale = 1 + 0.14 * p
    dx = -canvas.width * 0.04 * p
    dy = canvas.height * 0.025 * p
  } else if (anim === 'zoom-in') {
    scale = 1 + 0.25 * p
  } else if (anim === 'zoom-out') {
    scale = 1.25 - 0.25 * p
  }
  return { scale, dx, dy }
}

function drawClip(clip, localTime) {
  if (!clip || !clip.image) return
  if (clip.kind === 'article') {
    drawArticleClip(clip, localTime)
    return
  }
  const rect = layoutRect(clip)
  const anim = animationTransform(clip, localTime)

  ctx.save()
  ctx.beginPath()
  ctx.rect(rect.x, rect.y, rect.w, rect.h)
  ctx.clip()

  const iw = clip.image.width
  const ih = clip.image.height
  const baseScale = rect.fit === 'contain' ? Math.min(rect.w / iw, rect.h / ih) : Math.max(rect.w / iw, rect.h / ih)
  const drawW = iw * baseScale * anim.scale
  const drawH = ih * baseScale * anim.scale
  const cx = rect.x + rect.w / 2 + anim.dx
  const cy = rect.y + rect.h / 2 + anim.dy
  ctx.drawImage(clip.image, cx - drawW / 2, cy - drawH / 2, drawW, drawH)

  ctx.restore()
}

// --------------------------- Article rendering ---------------------------

// Compute the vertical offset (canvas pixels) for drawing a scaled screenshot.
// mode='edit' uses the user-scrolled position; 'play'/'pause' animates.
function articleScroll(clip, localTime, drawH, mode) {
  if (mode === 'edit') return clip._editScrollY || 0

  const canH = canvas.height
  if (drawH <= canH) return (canH - drawH) / 2

  const minOffset = canH - drawH // most-scrolled position (end of article)
  const dur = Math.max(0.01, clip.duration)
  const p = clamp(localTime / dur, 0, 1)

  if (clip.highlight) {
    // Anchor the highlight's vertical center to the canvas center, clamped
    // so we never scroll past the article edges.
    const hCenterDrawY = (clip.highlight.y + clip.highlight.h / 2) * drawH
    const target = canH / 2 - hCenterDrawY
    const clamped = Math.max(minOffset, Math.min(0, target))
    // Ease from top to the highlight over the first 60% of the clip.
    const q = clamp(p / 0.6, 0, 1)
    const ease = 1 - Math.pow(1 - q, 3)
    return 0 + (clamped - 0) * ease
  }

  // No highlight: auto scroll top to bottom for the full duration.
  return minOffset * p
}

function drawArticleClip(clip, localTime) {
  const img = clip.image
  if (!img) return
  const iw = img.width
  const ih = img.height

  // Fit to canvas width; article will be taller than the canvas when full-page.
  const drawW = canvas.width
  const drawH = (ih / iw) * drawW

  const editing = highlightEdit.clipId === clip.id
  const mode = editing ? 'edit' : state.playing ? 'play' : 'pause'
  const offsetY = articleScroll(clip, localTime, drawH, mode)

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, canvas.width, canvas.height)
  ctx.clip()

  // Background fill so bands above/below a short article match the bg color.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, offsetY, drawW, drawH)

  // Vignette: dim everything except the highlight rect. Suppressed while the
  // user is actively editing so they can see the whole page.
  if (clip.highlight && !editing) {
    const hx = clip.highlight.x * drawW
    const hy = clip.highlight.y * drawH + offsetY
    const hw = clip.highlight.w * drawW
    const hh = clip.highlight.h * drawH
    // Soft reveal so the vignette doesn't snap in on frame 1.
    const reveal = clamp(localTime / 0.35, 0, 1)
    const alpha = 0.62 * reveal

    ctx.save()
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
    ctx.beginPath()
    ctx.rect(0, 0, canvas.width, canvas.height)
    ctx.rect(hx, hy, hw, hh)
    ctx.fill('evenodd')
    ctx.strokeStyle = `rgba(255, 236, 61, ${0.9 * reveal})`
    ctx.lineWidth = Math.max(3, canvas.width * 0.005)
    ctx.strokeRect(hx, hy, hw, hh)
    ctx.restore()
  }

  // Edit-mode overlays: in-progress drag rect, existing highlight, help banner.
  if (editing) {
    if (highlightEdit.dragging) {
      const x = Math.min(highlightEdit.startX, highlightEdit.curX)
      const y = Math.min(highlightEdit.startY, highlightEdit.curY)
      const w = Math.abs(highlightEdit.curX - highlightEdit.startX)
      const h = Math.abs(highlightEdit.curY - highlightEdit.startY)
      ctx.save()
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
      ctx.beginPath()
      ctx.rect(0, 0, canvas.width, canvas.height)
      ctx.rect(x, y, w, h)
      ctx.fill('evenodd')
      ctx.strokeStyle = '#ffec3d'
      ctx.lineWidth = Math.max(3, canvas.width * 0.005)
      ctx.setLineDash([canvas.width * 0.015, canvas.width * 0.01])
      ctx.strokeRect(x, y, w, h)
      ctx.restore()
    } else if (clip.highlight) {
      const hx = clip.highlight.x * drawW
      const hy = clip.highlight.y * drawH + offsetY
      const hw = clip.highlight.w * drawW
      const hh = clip.highlight.h * drawH
      ctx.save()
      ctx.strokeStyle = '#ffec3d'
      ctx.lineWidth = Math.max(3, canvas.width * 0.005)
      ctx.setLineDash([canvas.width * 0.015, canvas.width * 0.01])
      ctx.strokeRect(hx, hy, hw, hh)
      ctx.restore()
    }

    ctx.save()
    const bannerH = canvas.height * 0.055
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)'
    ctx.fillRect(0, 0, canvas.width, bannerH)
    ctx.fillStyle = '#ffec3d'
    const fs = Math.round(bannerH * 0.42)
    ctx.font = `700 ${fs}px "Helvetica Neue", Helvetica, Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Drag to highlight · wheel to scroll · Esc / Done to exit', canvas.width / 2, bannerH / 2)
    ctx.restore()
  }

  ctx.restore()
}

function roundRect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Split words into visual chunks of up to CAPTION.chunkSize that fit the caption width.
function chunkCaption(words, fontSize) {
  const maxWidth = canvas.width * CAPTION.maxWidthRatio
  const gap = fontSize * 0.35
  const chunks = []
  let cur = []
  let curWidth = 0
  for (const word of words) {
    const ww = ctx.measureText(word).width
    const next = cur.length ? curWidth + gap + ww : ww
    const overflow = next > maxWidth
    const atCap = cur.length >= CAPTION.chunkSize
    if (cur.length && (overflow || atCap)) {
      chunks.push(cur)
      cur = [word]
      curWidth = ww
    } else {
      cur.push(word)
      curWidth = next
    }
  }
  if (cur.length) chunks.push(cur)
  return chunks
}

function drawCaption(clip, localTime) {
  if (!state.captionsEnabled) return
  if (!clip || !clip.caption) return
  // Don't overlay captions while the user is placing a highlight rect - the
  // pill can obscure the edit banner and confuse pointer targets.
  if (highlightEdit.clipId && clip.id === highlightEdit.clipId) return
  const words = clip.caption.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return

  // Use the larger of height-based and width-based so captions stay
  // readable regardless of aspect ratio (tall 9:16 or short 16:9).
  const fontSize = Math.round(
    Math.max(canvas.height * CAPTION.fontSizeRatio, canvas.width * CAPTION.fontSizeRatioByWidth),
  )
  ctx.save()
  ctx.font = `900 ${fontSize}px ${CAPTION.fontFamily}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'

  const chunks = chunkCaption(words, fontSize)
  const dur = Math.max(0.01, clip.duration)
  const chunkDur = dur / chunks.length
  const t = Math.max(0, Math.min(dur - 0.0001, localTime))
  const chunkIdx = Math.min(chunks.length - 1, Math.floor(t / chunkDur))
  const chunk = chunks[chunkIdx]
  const wordDur = chunkDur / chunk.length
  const activeIdx = Math.min(chunk.length - 1, Math.floor((t - chunkIdx * chunkDur) / wordDur))

  const gap = fontSize * 0.35
  const widths = chunk.map((w) => ctx.measureText(w).width)
  const totalW = widths.reduce((s, w) => s + w, 0) + gap * (chunk.length - 1)
  const y = canvas.height * CAPTION.yRatio
  let x = (canvas.width - totalW) / 2

  // Pass 1: stroke every word (so strokes don't overlap the pill).
  ctx.lineWidth = fontSize * 0.14
  ctx.strokeStyle = CAPTION.colorStroke
  let cx = x
  for (let i = 0; i < chunk.length; i++) {
    ctx.strokeText(chunk[i], cx, y)
    cx += widths[i] + gap
  }

  // Pass 2: pill behind the active word.
  const padX = fontSize * 0.22
  const padY = fontSize * 0.12
  const radius = fontSize * 0.22
  let activeX = x
  for (let i = 0; i < activeIdx; i++) activeX += widths[i] + gap
  const aw = widths[activeIdx]
  ctx.fillStyle = CAPTION.colorPill
  roundRect(activeX - padX, y - fontSize / 2 - padY, aw + padX * 2, fontSize + padY * 2, radius)
  ctx.fill()

  // Pass 3: fill every word (active gets different color).
  cx = x
  for (let i = 0; i < chunk.length; i++) {
    ctx.fillStyle = i === activeIdx ? CAPTION.colorActive : CAPTION.colorBase
    ctx.fillText(chunk[i], cx, y)
    cx += widths[i] + gap
  }

  ctx.restore()
}

function draw() {
  ctx.fillStyle = state.bgColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const hasVisibleChars = state.characters.some((c) => c.visible)

  if (state.clips.length === 0 && !hasVisibleChars) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '20px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Add images from the library to begin', canvas.width / 2, canvas.height / 2)
    updateTimeLabel()
    return
  }

  let clip = null
  let localTime = 0
  if (state.clips.length > 0) {
    if (state.playing) {
      clip = activeClip(state.currentTime)
      localTime = clip ? state.currentTime - clip.start : 0
    } else {
      // When paused, preview the settled state (mid-clip) so entrance animations
      // have finished and the user sees the layout as it'll read.
      clip = state.selectedClip
      localTime = clip ? clip.duration * 0.5 : 0
    }
  }

  if (clip) drawClip(clip, localTime)
  drawCharacters()
  if (clip) drawCaption(clip, localTime)

  updateTimeLabel()
}

function updateTimeLabel() {
  const total = totalDuration()
  $('timeLabel').textContent = `${state.currentTime.toFixed(1)} / ${total.toFixed(1)} s`
  $('totalLabel').textContent = `${total.toFixed(1)} s`
}

// --------------------------- Voiceover (ElevenLabs) ---------------------------

async function generateVoiceover() {
  const key = getKey('elevenlabs')
  if (!key) {
    alert('No ElevenLabs API key found in keys.local.js.')
    return
  }
  if (state.clips.length === 0) {
    alert('Add clips first (or run AI Bundle).')
    return
  }
  const captions = state.clips.map((c) => (c.caption || '').trim()).filter(Boolean)
  if (captions.length === 0) {
    alert('None of the clips have captions yet. Type a caption per clip or run AI Bundle first.')
    return
  }
  const script = captions.join(' ')

  const btn = $('generateBtn')
  btn.disabled = true
  btn.textContent = 'Voiceover...'

  try {
    // Walk the voice fallback chain: stop at the first voice that returns audio.
    let blob = null
    let lastErr = null
    for (const voice of ELEVENLABS.voices) {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=mp3_44100_128`
      let res
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'xi-api-key': key, 'Content-Type': 'application/json', accept: 'audio/mpeg' },
          body: JSON.stringify({
            text: script,
            model_id: ELEVENLABS.model,
            voice_settings: ELEVENLABS.settings,
          }),
        })
      } catch (err) {
        lastErr = err
        continue
      }
      if (res.ok) {
        blob = await res.blob()
        _activeVoice = voice
        break
      }
      const body = await res.text()
      lastErr = new Error(`ElevenLabs HTTP ${res.status} for ${voice.name}: ${body.slice(0, 180)}`)
      // 401 is bad key; no point trying more voices.
      if (res.status === 401 || res.status === 403) break
    }
    if (!blob) throw lastErr || new Error('No ElevenLabs voice succeeded.')
    if (blob.size < 500) throw new Error('ElevenLabs returned an empty audio blob.')

    clearVoiceoverAudio()
    const audioUrl = URL.createObjectURL(blob)
    const audio = new Audio(audioUrl)
    audio.preload = 'auto'
    audio.volume = 1
    audio.muted = false
    await new Promise((resolve, reject) => {
      audio.addEventListener('loadedmetadata', resolve, { once: true })
      audio.addEventListener('error', () => reject(new Error('Failed to decode VO audio.')), { once: true })
    })
    state.audio = audio
    state.audioUrl = audioUrl
    console.log(`[VO] ${_activeVoice.name} - ${audio.duration.toFixed(1)}s - ${blob.size} bytes - type ${blob.type}`)

    // Re-time clip durations proportionally to per-clip word count so the
    // captions line up (roughly) with the voiceover.
    const total = audio.duration
    if (isFinite(total) && total > 0) {
      const counts = state.clips.map((c) => {
        const n = (c.caption || '').trim().split(/\s+/).filter(Boolean).length
        return Math.max(1, n)
      })
      const sum = counts.reduce((s, n) => s + n, 0)
      let accum = 0
      state.clips.forEach((c, i) => {
        const last = i === state.clips.length - 1
        const d = last ? Math.max(0.1, total - accum) : Math.max(0.1, (counts[i] / sum) * total)
        c.duration = d
        accum += d
      })
      recomputeStarts()
      renderClipsList()
      draw()
    }

    updateVOStatus()
  } catch (err) {
    alert('Voiceover failed: ' + err.message)
    throw err
  } finally {
    btn.disabled = false
  }
}

function clearVoiceoverAudio() {
  if (state.audio) {
    try {
      state.audio.pause()
    } catch (_) {}
  }
  if (state.audioUrl) URL.revokeObjectURL(state.audioUrl)
  state.audio = null
  state.audioUrl = null
}

function updateVOStatus() {
  const status = $('voStatus')
  if (state.audio) {
    status.textContent = `Voiceover: ${_activeVoice.name} · ${state.audio.duration.toFixed(1)}s · clips synced to audio`
    status.hidden = false
  } else {
    status.hidden = true
  }
}

// --------------------------- Playback ---------------------------

let playStart = 0
let rafId = null

function play() {
  if (state.clips.length === 0) return
  state.playing = true
  $('playBtn').textContent = 'Stop'
  if (state.currentTime >= totalDuration() - 0.01) state.currentTime = 0
  playStart = performance.now() - state.currentTime * 1000
  if (state.audio) {
    state.audio.currentTime = Math.min(state.currentTime, Math.max(0, state.audio.duration - 0.01))
    state.audio.muted = false
    state.audio.volume = 1
    state.audio.play().catch((err) => {
      console.error('[VO] audio.play() blocked:', err)
      alert(
        'Voiceover could not start: ' +
          err.message +
          '\n\nClick Play again, or check that your browser tab is not muted.',
      )
    })
  }
  const loop = () => {
    if (!state.playing) return
    state.currentTime = (performance.now() - playStart) / 1000
    if (state.currentTime >= totalDuration()) {
      stop()
      state.currentTime = 0
      draw()
      return
    }
    draw()
    rafId = requestAnimationFrame(loop)
  }
  loop()
}

function stop() {
  state.playing = false
  $('playBtn').textContent = 'Play'
  if (rafId) cancelAnimationFrame(rafId)
  if (state.audio) {
    try {
      state.audio.pause()
    } catch (_) {}
  }
}

// --------------------------- Export ---------------------------

function pickMimeType() {
  const options = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4;codecs=h264,aac',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  return options.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m))
}

async function exportVideo() {
  if (state.clips.length === 0) {
    alert('Add at least one clip before exporting.')
    return
  }
  const mime = pickMimeType()
  if (!mime) {
    alert('MediaRecorder is not supported in this browser.')
    return
  }
  const fps = parseInt($('fps').value, 10) || 30

  stop()
  state.currentTime = 0
  state.selectedClip = null
  draw()

  const stream = canvas.captureStream(fps)

  // Mix in the ElevenLabs voiceover if we have one. We use a fresh Audio
  // element bound to the same blob URL so the main state.audio is untouched
  // and we can close the AudioContext safely when export finishes.
  let audioCtx = null
  let exportAudio = null
  if (state.audioUrl) {
    try {
      exportAudio = new Audio(state.audioUrl)
      exportAudio.preload = 'auto'
      await new Promise((resolve, reject) => {
        exportAudio.addEventListener('loadedmetadata', resolve, { once: true })
        exportAudio.addEventListener('error', reject, { once: true })
      })
      const Ctor = window.AudioContext || window.webkitAudioContext
      audioCtx = new Ctor()
      const source = audioCtx.createMediaElementSource(exportAudio)
      const dest = audioCtx.createMediaStreamDestination()
      source.connect(dest)
      for (const track of dest.stream.getAudioTracks()) stream.addTrack(track)
    } catch (err) {
      console.warn('[export] could not mix VO audio, exporting video-only:', err)
      audioCtx = null
      exportAudio = null
    }
  }

  const chunks = []
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 })
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const total = totalDuration()
  const exportBtn = $('exportBtn')
  exportBtn.disabled = true
  exportBtn.textContent = 'Recording...'

  recorder.start()
  state.playing = true
  if (exportAudio) {
    try {
      exportAudio.currentTime = 0
      await exportAudio.play()
    } catch (err) {
      console.warn('[export] VO play failed:', err)
    }
  }

  const t0 = performance.now()
  await new Promise((resolve) => {
    const tick = () => {
      const elapsed = (performance.now() - t0) / 1000
      state.currentTime = elapsed
      draw()
      if (elapsed >= total) resolve()
      else requestAnimationFrame(tick)
    }
    tick()
  })

  state.playing = false
  if (exportAudio) {
    try {
      exportAudio.pause()
    } catch (_) {}
  }
  await new Promise((resolve) => {
    recorder.onstop = resolve
    recorder.stop()
  })
  if (audioCtx) {
    try {
      await audioCtx.close()
    } catch (_) {}
  }

  const blob = new Blob(chunks, { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm'
  a.href = url
  a.download = `canvas-video-${Date.now()}.${ext}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  exportBtn.disabled = false
  exportBtn.textContent = 'Export Video'
  state.currentTime = 0
  draw()
}

// --------------------------- News Bundle (Gemini + Google Search + Vision) ---------------------------

// Calls Gemini with the native Google Search grounding tool. Returns the
// model's text response plus the grounding metadata (source URLs). We don't
// set responseMimeType=application/json here because that's incompatible with
// the google_search tool - we just parse JSON out of the response text.
async function callGeminiWithSearch(prompt, apiKey) {
  const models = [GEMINI_MODEL, ...GEMINI_FALLBACKS]
  let lastErr = null
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.7 },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const parts = data.candidates?.[0]?.content?.parts || []
        const text = parts
          .map((p) => p.text)
          .filter(Boolean)
          .join('\n')
        if (text) {
          return { text, metadata: data.candidates?.[0]?.groundingMetadata || null }
        }
        lastErr = new Error('Gemini returned no text.')
        continue
      }
      if (res.status === 404) {
        lastErr = new Error(`Model ${model} not found.`)
        continue
      }
      const body = await res.text()
      lastErr = new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 240)}`)
      // 400 = likely bad request (tool/mime conflict); no point retrying other models.
      if (res.status === 400 || res.status === 401 || res.status === 403) break
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr || new Error('All Gemini models failed for Google Search.')
}

// Downscale an image to a target max width, return base64 JPEG for Vision.
// Full-page screenshots can be 8000+ px tall; sending them at full res
// eats tokens and often hits per-request size limits.
async function imageToBase64(srcUrl, maxWidth = 1024) {
  const res = await fetch(srcUrl, { mode: 'cors' })
  if (!res.ok) throw new Error(`Fetch screenshot HTTP ${res.status}`)
  const blob = await res.blob()
  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const cvs =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement('canvas'), { width: w, height: h })
  const cctx = cvs.getContext('2d')
  cctx.drawImage(bitmap, 0, 0, w, h)
  let outBlob
  if (cvs.convertToBlob) {
    outBlob = await cvs.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
  } else {
    outBlob = await new Promise((resolve) => cvs.toBlob(resolve, 'image/jpeg', 0.85))
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg', width: w, height: h })
    }
    reader.onerror = reject
    reader.readAsDataURL(outBlob)
  })
}

// Ask Gemini Vision to locate a sentence in an article screenshot and return
// the bounding box as normalized 0-1 coords. Returns null on any failure so
// the caller can fall back to "no highlight" gracefully.
async function findHighlightBBox(imageUrl, sentence, apiKey) {
  try {
    const { base64, mimeType } = await imageToBase64(imageUrl, 1024)
    const prompt = `You are looking at a full-page screenshot of a news article.

Find the sentence (or the closest visually-matching phrase) from the article
that corresponds to this quote:

"${sentence}"

Return ONLY a JSON object with the bounding box in NORMALIZED coordinates where
each value is a number between 0 and 1, relative to the full image:
- (0, 0) is top-left, (1, 1) is bottom-right.
- "x" and "y" are the top-left corner of the box.
- "w" and "h" are width and height of the box.

Format:
{"x": 0.04, "y": 0.38, "w": 0.92, "h": 0.07}

Rules:
- Include about 2% padding around the sentence so it looks cinematic.
- If the sentence spans multiple lines, include all of them.
- If you genuinely cannot find any matching phrase, return {"x":0,"y":0,"w":0,"h":0}.
- Output JSON only. No markdown, no explanation.`
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null
    const parsed = JSON.parse(text)
    const x = Number(parsed.x)
    const y = Number(parsed.y)
    const w = Number(parsed.w)
    const h = Number(parsed.h)
    if (![x, y, w, h].every(Number.isFinite)) return null
    if (w <= 0.005 || h <= 0.005) return null
    const hx = clamp(x, 0, 1)
    const hy = clamp(y, 0, 1)
    return {
      x: hx,
      y: hy,
      w: clamp(w, 0.02, 1 - hx),
      h: clamp(h, 0.01, 1 - hy),
    }
  } catch (err) {
    console.warn('[news] highlight bbox detection failed:', err)
    return null
  }
}

// Fetch a single article screenshot via Microlink (free tier, ~50/day/IP).
// Returns a CORS-proxied URL so canvas.captureStream stays untainted.
//
// Viewport-only (no full_page) is intentional: full_page is flaky on the
// free tier and 400s on sites with anti-bot or paywall middleware. The
// 720x1280 viewport scaled to a 1080x1920 canvas is an exact 9:16 fit, so
// the article displays without scrolling - and the headline + lede that
// live above the fold are exactly what we need to highlight anyway.
// Verify the article URL actually resolves before paying Microlink to
// screenshot a 404 page. Goes through the same CORS proxy chain since
// browsers can't fetch arbitrary cross-origin URLs directly.
async function isUrlAlive(articleUrl) {
  const proxy = await pickWorkingProxy()
  const target = proxy + encodeURIComponent(articleUrl)
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 12000)
  try {
    const res = await fetch(target, { mode: 'cors', signal: ctrl.signal })
    // Treat proxy/network failures as inconclusive (assume alive) so a
    // flaky proxy doesn't kill every shot.
    if (res.status === 0) return true
    if (res.status === 404 || res.status === 410) return false
    if (!res.ok && res.status !== 403) return res.status < 500
    const finalUrl = (res.url || '').toLowerCase()
    if (/\/(404|page-not-found|not-found)(?:\b|\/|\?|$)/.test(finalUrl)) return false
    let html = ''
    try {
      html = (await res.text()).slice(0, 8000).toLowerCase()
    } catch {
      return true
    }
    if (!html) return true
    // Only the strongest soft-404 signals: a 404/Page Not Found in <title>.
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/)
    const title = titleMatch ? titleMatch[1] : ''
    if (/(^|[^a-z])404([^a-z]|$)/.test(title) || /\bpage not found\b/.test(title)) return false
    return true
  } catch (_) {
    // Network/abort/CORS — inconclusive. Let microlink try; it has its own
    // failure path that already skips bad shots.
    return true
  } finally {
    clearTimeout(t)
  }
}

async function microlinkScreenshot(articleUrl) {
  const q =
    `${MICROLINK_ENDPOINT}?url=${encodeURIComponent(articleUrl)}` +
    `&screenshot=true&type=png` +
    `&viewport.width=720&viewport.height=1280`
  const res = await fetch(q)
  if (!res.ok) {
    let msg = `Microlink HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body?.message) msg = `${msg} - ${body.message}`
    } catch (_) {}
    throw new Error(msg)
  }
  const data = await res.json()
  if (data.status !== 'success') throw new Error(data.message || 'Microlink failed')
  const shotUrl = data?.data?.screenshot?.url
  if (!shotUrl) throw new Error('no screenshot URL in response')
  return corsProxy(shotUrl)
}

// News bundle pipeline: Gemini with Google Search picks real articles from
// multiple sources, Microlink screenshots them, Gemini Vision auto-highlights
// the sentence each voiceover line is paraphrasing.
async function newsBundle(concept) {
  const geminiKey = $('geminiKey').value.trim()
  if (!geminiKey) {
    alert('Paste a Gemini API key in the top bar.\nGet one free at https://aistudio.google.com/apikey')
    return
  }
  const btn = $('generateBtn')
  const status = $('articleStatus')
  status.classList.remove('error')
  status.hidden = false

  // Pre-flight: pick a working CORS proxy so subsequent screenshot loads
  // don't all hit the same dead one and waste Microlink quota.
  status.textContent = 'Finding a working CORS proxy...'
  await pickWorkingProxy()

  status.textContent = 'Gemini + Google Search is finding recent coverage...'

  const prompt = `You are planning a vertical short-form video (9:16 TikTok/Reels)
that cites real news coverage with real screenshots.

Concept: "${concept}"

HARD RULES on URLs - violating these wastes the user's API budget:
- Every URL MUST come from a Google Search result you actually saw in this
  call. Do NOT construct, guess, complete, or "fix" URLs. Do NOT pattern-match
  a URL from one outlet's structure (e.g. "npr.org/YYYY/MM/DD/nx-s1-...").
- The article MUST directly cover "${concept}". Tangentially related stories,
  op-eds about a different event, or generic topic hubs do NOT count. If the
  headline does not name the concept or its core entities, drop it.
- No homepages, section pages (/news, /tech, /politics), tag pages, search
  result pages, author pages, or "topic" landing pages. Direct article only.
- No URLs older than 18 months unless the concept is explicitly historical.
- Prefer URLs that include a clear article slug (dated path or
  human-readable headline-slug). Reject bare IDs like "/article/12345"
  unless Google Search clearly returned it for this query.
- If you cannot find 6 articles that satisfy ALL of the above, return FEWER
  shots. Do not pad with weak matches.

STEP 1 - use Google Search to find 6 to 8 recent news articles about this
concept. Strongly prefer DIFFERENT reputable sources from this list (these
render reliably in a headless browser):

- AP News (apnews.com)
- NPR (npr.org)
- BBC News (bbc.com / bbc.co.uk)
- The Guardian (theguardian.com)
- CNN (cnn.com)
- CBS News, NBC News, ABC News
- Wired (wired.com)
- Ars Technica (arstechnica.com)
- The Verge (theverge.com)
- TechCrunch (techcrunch.com)
- Vox (vox.com)
- Vice (vice.com)
- ProPublica
- Al Jazeera English
- ESPN (sports)
- BBC Sport / The Athletic public pages

AVOID these sources entirely - their bot protection or paywalls block
headless screenshotters: Reuters, NYT, Wall Street Journal, Bloomberg,
Financial Times, The Economist, The Atlantic (paywall), New Yorker,
Washington Post (paywall), any Substack with a paywall, any "subscriber
only" page, link-aggregators like Yahoo / MSN / AP wire reposts, press
releases.

STEP 2 - for each article, write one shot. A shot is:
- url: the article URL Search returned. Must be a DIRECT article page, not a
  homepage, section index, or search results page.
- source: publication name (short, e.g. "Reuters", "BBC News").
- caption: 4 to 10 word narration line. Natural spoken English. No
  hashtags, no emoji, no trailing punctuation.
- highlight_sentence: one sentence (or near-verbatim phrase) from the
  article that backs up the caption. Must be a real quote the reader can
  actually see in the published article. Keep it under ~25 words so a
  highlight rectangle on the screenshot stays readable.
- duration: 3.0 to 5.0 seconds.

Captions joined in order must read like one coherent 30-60 word narration
with a clear arc (setup -> evidence -> payoff). Mix angles / sources so
the video feels balanced. Avoid two consecutive shots from the same
outlet.

Return RAW JSON only (no markdown fences, no prose):
{
  "intro": "optional short opening caption, 4-8 words",
  "shots": [
    { "url": "https://...", "source": "Reuters", "caption": "...",
      "highlight_sentence": "...", "duration": 3.5 }
  ]
}`

  btn.disabled = true
  btn.textContent = 'Searching...'

  try {
    const { text } = await callGeminiWithSearch(prompt, geminiKey)
    const plan = parseAIPlan(text)
    const rawShots = (Array.isArray(plan.shots) ? plan.shots : []).slice(0, 8)
    const shots = rawShots.filter((s) => s && typeof s.url === 'string' && /^https?:\/\//i.test(s.url))
    if (shots.length === 0) throw new Error('Gemini returned no usable article URLs.')

    status.textContent = `Gemini picked ${shots.length} articles. Screenshotting + highlighting...`

    // Wipe the existing timeline so News replaces Stock cleanly.
    stop()
    if (highlightEdit.clipId) exitHighlightEdit()
    state.clips = []
    state.selectedClip = null
    state.currentTime = 0
    renderClipsList()
    draw()

    const TARGET_SHOTS = Math.max(6, Math.min(shots.length, 8))
    const MAX_BACKFILL_ROUNDS = 2
    const triedUrls = new Set()
    const deadUrls = new Set()
    let okCount = 0

    const processShot = async (shot, idx, total) => {
      const host = (() => {
        try {
          return new URL(shot.url).hostname.replace(/^www\./, '')
        } catch {
          return shot.source || 'article'
        }
      })()

      btn.textContent = `Screenshot ${idx + 1}/${total}...`
      status.textContent = `Checking ${shot.source || host}: ${shot.url}`
      triedUrls.add(shot.url)

      const alive = await isUrlAlive(shot.url)
      if (!alive) {
        console.warn(`[news] dead URL, skipping: ${shot.url}`)
        status.textContent = `Skipped ${shot.source || host}: dead link (404 or hallucinated)`
        deadUrls.add(shot.url)
        return
      }

      status.textContent = `Fetching ${shot.source || host}: ${shot.url}`
      let shotUrl = null
      try {
        shotUrl = await microlinkScreenshot(shot.url)
      } catch (err) {
        console.warn(`[news] screenshot failed for ${shot.url}:`, err)
        status.textContent = `Skipped ${shot.source || host}: ${err.message}`
        return
      }

      try {
        await addClipFromArticle(shotUrl, shot.url)
      } catch (err) {
        console.warn(`[news] clip load failed for ${shot.url}:`, err)
        return
      }
      const clip = state.clips[state.clips.length - 1]
      if (!clip) return
      clip.caption = typeof shot.caption === 'string' ? shot.caption.trim() : ''
      clip.duration = clamp(parseFloat(shot.duration) || 4, 1, 8)
      clip.sourceName = shot.source || host
      clip.sourceHost = host
      okCount++

      if (shot.highlight_sentence && clip.image) {
        btn.textContent = `Highlight ${idx + 1}/${total}...`
        status.textContent = `Locating "${String(shot.highlight_sentence).slice(0, 60)}..."`
        const bbox = await findHighlightBBox(shotUrl, shot.highlight_sentence, geminiKey)
        if (bbox) clip.highlight = bbox
      }
      recomputeStarts()
      renderClipsList()
      draw()
    }

    for (let i = 0; i < shots.length && okCount < TARGET_SHOTS; i++) {
      await processShot(shots[i], i, shots.length)
    }

    // Backfill: if dead/failed URLs left us short, re-prompt Gemini with the
    // bad URLs as exclusions and process the replacements.
    let round = 0
    while (okCount < TARGET_SHOTS && round < MAX_BACKFILL_ROUNDS) {
      round++
      const need = TARGET_SHOTS - okCount
      status.textContent = `Backfilling ${need} more articles (round ${round})...`
      const exclusions = [...triedUrls]
        .slice(0, 30)
        .map((u) => `- ${u}`)
        .join('\n')
      const backfillPrompt = `${prompt}\n\nIMPORTANT - these URLs were already tried and either 404'd or failed to render. Do NOT return any of these or any URL on the same path. Pick FRESH article URLs from DIFFERENT stories:\n${exclusions}\n\nReturn ${Math.min(need + 2, 6)} new shots only.`
      let extra = []
      try {
        const { text: txt2 } = await callGeminiWithSearch(backfillPrompt, geminiKey)
        const plan2 = parseAIPlan(txt2)
        extra = (Array.isArray(plan2.shots) ? plan2.shots : []).filter(
          (s) => s && typeof s.url === 'string' && /^https?:\/\//i.test(s.url) && !triedUrls.has(s.url),
        )
      } catch (err) {
        console.warn('[news] backfill prompt failed:', err)
        break
      }
      if (extra.length === 0) break
      for (let j = 0; j < extra.length && okCount < TARGET_SHOTS; j++) {
        await processShot(extra[j], j, extra.length)
      }
    }

    if (okCount === 0) throw new Error('Every article failed to screenshot.')
    status.textContent = `Added ${okCount} news clips. Generating voiceover...`

    await generateVoiceover()
    status.textContent = `Done - ${okCount} news clips with voiceover. Press Play.`

    if (state.audio && state.clips.length > 0) {
      state.currentTime = 0
      if (!state.playing) play()
    }
  } catch (err) {
    status.textContent = 'News search failed: ' + err.message
    status.classList.add('error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Generate'
  }
}

// --------------------------- Orchestrator ---------------------------

// One Generate button. The "Auto-research news" checkbox toggles between two
// pipelines: stock (Gemini storyboard + Pixabay) and news (Gemini Search +
// Microlink screenshots + Vision auto-highlight). Both end with an ElevenLabs
// voiceover and clips re-timed to match the VO.
async function generate() {
  const concept = $('storyInput').value.trim()
  if (!concept) return
  const btn = $('generateBtn')
  const useNews = !!$('useNewsCheckbox').checked
  try {
    if (useNews) {
      // newsBundle handles its own VO + autoplay because the long-running
      // screenshot+highlight loop streams progress messages.
      await newsBundle(concept)
    } else {
      await aiBundle(concept)
      if (state.clips.length > 0) await generateVoiceover()
      if (state.audio && state.clips.length > 0) {
        state.currentTime = 0
        if (!state.playing) play()
      }
    }
  } catch (_) {
    /* errors are surfaced inside the bundle (alert/articleStatus) */
  } finally {
    btn.textContent = 'Generate'
  }
}

// --------------------------- Bindings ---------------------------

$('generateBtn').addEventListener('click', generate)
$('storyInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('generateBtn').click()
})
$('playBtn').addEventListener('click', () => {
  state.playing ? stop() : play()
})
$('exportBtn').addEventListener('click', exportVideo)

// Persist the Auto-research toggle so first-time users don't hit it by
// accident, and returning users keep their choice across reloads.
try {
  $('useNewsCheckbox').checked = localStorage.getItem('useNews') === '1'
} catch (_) {}
$('useNewsCheckbox').addEventListener('change', (e) => {
  try {
    localStorage.setItem('useNews', e.target.checked ? '1' : '0')
  } catch (_) {}
})

// Pointer drag on the main canvas sets the highlight rect while an article
// clip is in edit mode. Coordinates are canvas pixels; converted to normalized
// screenshot coords on pointer-up so the rect survives scroll/resize changes.
function canvasPointFromEvent(e) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  }
}

canvas.addEventListener('pointerdown', (e) => {
  if (!highlightEdit.clipId) return
  const clip = state.clips.find((c) => c.id === highlightEdit.clipId)
  if (!clip || !clip.image) return
  const p = canvasPointFromEvent(e)
  highlightEdit.dragging = true
  highlightEdit.startX = p.x
  highlightEdit.startY = p.y
  highlightEdit.curX = p.x
  highlightEdit.curY = p.y
  try {
    canvas.setPointerCapture(e.pointerId)
  } catch (_) {}
  draw()
})

canvas.addEventListener('pointermove', (e) => {
  if (!highlightEdit.clipId || !highlightEdit.dragging) return
  const p = canvasPointFromEvent(e)
  highlightEdit.curX = p.x
  highlightEdit.curY = p.y
  draw()
})

canvas.addEventListener('pointerup', (e) => {
  if (!highlightEdit.clipId || !highlightEdit.dragging) return
  const clip = state.clips.find((c) => c.id === highlightEdit.clipId)
  highlightEdit.dragging = false
  try {
    canvas.releasePointerCapture(e.pointerId)
  } catch (_) {}
  if (!clip || !clip.image) {
    draw()
    return
  }

  const x = Math.min(highlightEdit.startX, highlightEdit.curX)
  const y = Math.min(highlightEdit.startY, highlightEdit.curY)
  const w = Math.abs(highlightEdit.curX - highlightEdit.startX)
  const h = Math.abs(highlightEdit.curY - highlightEdit.startY)
  // Ignore accidental clicks: require at least 4% of canvas width in both dims.
  const minSize = canvas.width * 0.04
  if (w < minSize || h < minSize) {
    draw()
    return
  }

  const drawW = canvas.width
  const drawH = (clip.image.height / clip.image.width) * drawW
  const offsetY = clip._editScrollY || 0

  const hx = clamp(x / drawW, 0, 1)
  const hy = clamp((y - offsetY) / drawH, 0, 1)
  const hw = clamp(w / drawW, 0.01, 1 - hx)
  const hh = clamp(h / drawH, 0.01, 1 - hy)
  clip.highlight = { x: hx, y: hy, w: hw, h: hh }

  renderClipsList()
  draw()
})

// Wheel scrolls the article while in highlight-edit mode so highlights can
// land anywhere on a tall article, not just the viewport.
canvas.addEventListener(
  'wheel',
  (e) => {
    if (!highlightEdit.clipId) return
    const clip = state.clips.find((c) => c.id === highlightEdit.clipId)
    if (!clip || !clip.image) return
    const drawH = (clip.image.height / clip.image.width) * canvas.width
    if (drawH <= canvas.height) return
    e.preventDefault()
    const minOffset = canvas.height - drawH
    const current = clip._editScrollY || 0
    clip._editScrollY = Math.max(minOffset, Math.min(0, current - e.deltaY))
    draw()
  },
  { passive: false },
)

$('resolution').addEventListener('change', (e) => {
  const [w, h] = e.target.value.split('x').map(Number)
  canvas.width = w
  canvas.height = h
  draw()
})

$('bgColor').addEventListener('input', (e) => {
  state.bgColor = e.target.value
  draw()
})

$('captionsToggle').addEventListener('change', (e) => {
  state.captionsEnabled = e.target.checked
  draw()
})

// Load keys: prefer keys.local.js (git-ignored) over localStorage, fall back to empty.
// Any edit in the input still overrides and is re-saved to localStorage.
try {
  const baked = (typeof window !== 'undefined' && window.__KEYS__) || {}
  $('apiKey').value = baked.pixabay || localStorage.getItem('pixabayKey') || ''
  $('geminiKey').value = baked.gemini || localStorage.getItem('geminiKey') || ''
  if (baked.pixabay) localStorage.setItem('pixabayKey', baked.pixabay)
  if (baked.gemini) localStorage.setItem('geminiKey', baked.gemini)
  $('apiKey').addEventListener('input', (e) => {
    localStorage.setItem('pixabayKey', e.target.value)
  })
  $('geminiKey').addEventListener('input', (e) => {
    localStorage.setItem('geminiKey', e.target.value)
  })
} catch (_) {}

// Keyboard: space toggles play, delete removes selected clip, Esc exits
// highlight-edit mode.
window.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || ''
  if (e.key === 'Escape' && highlightEdit.clipId) {
    e.preventDefault()
    exitHighlightEdit()
    return
  }
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (e.code === 'Space') {
    e.preventDefault()
    state.playing ? stop() : play()
  } else if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedClip) {
    const sel = state.selectedClip
    if (highlightEdit.clipId === sel.id) exitHighlightEdit()
    state.clips = state.clips.filter((c) => c !== sel)
    state.selectedClip = state.clips[0] || null
    recomputeStarts()
    renderClipsList()
    draw()
  }
})

// --------------------------- Characters ---------------------------

// Tab switching for the left panel. Persists the chosen tab so a reload
// keeps the user where they were.
function setActiveTab(name) {
  state.currentTab = name
  for (const btn of document.querySelectorAll('.library .tab-btn')) {
    btn.classList.toggle('active', btn.dataset.tab === name)
  }
  for (const pane of document.querySelectorAll('.library .tab-pane')) {
    pane.hidden = pane.dataset.tab !== name
  }
  try {
    localStorage.setItem('activeTab', name)
  } catch (_) {}
}

for (const btn of document.querySelectorAll('.library .tab-btn')) {
  btn.addEventListener('click', () => setActiveTab(btn.dataset.tab))
}
try {
  const saved = localStorage.getItem('activeTab')
  if (saved === 'characters' || saved === 'library') setActiveTab(saved)
} catch (_) {}

// Stable random ids so card lookups survive re-renders.
function rid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9)
}

// Natural sort by filename so frame_1, frame_2, ..., frame_10 stay in order.
function naturalNameSort(a, b) {
  return String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: 'base' })
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('FileReader failed for ' + file.name))
    r.readAsDataURL(file)
  })
}

function dataURLToImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image decode failed'))
    img.src = dataUrl
  })
}

async function loadFilesAsFrames(files) {
  const arr = Array.from(files).sort(naturalNameSort)
  const frames = []
  for (const f of arr) {
    try {
      const dataUrl = await readFileAsDataURL(f)
      const image = await dataURLToImage(dataUrl)
      frames.push({ name: f.name, dataUrl, image })
    } catch (err) {
      console.warn('[character] frame load failed:', f.name, err)
    }
  }
  return frames
}

function findCharacter(id) {
  return state.characters.find((c) => c.id === id) || null
}

function findAnimation(char, animId) {
  return char.animations.find((a) => a.id === animId) || null
}

// "Talking" lookup: any animation whose name starts with talk/speak/mouth.
// Used so the active animation auto-switches while the voiceover plays without
// the user having to flip a toggle each time.
function findTalkAnimation(char) {
  return char.animations.find((a) => /^(talk|talking|speak|speaking|mouth)/i.test(a.name)) || null
}

function pickActiveAnim(char) {
  if (!char.animations.length) return null
  if (state.playing && state.audio) {
    const talk = findTalkAnimation(char)
    if (talk) return talk
  }
  const active = char.animations.find((a) => a.id === char.activeAnimId)
  return active || char.animations[0]
}

function drawCharacters() {
  if (highlightEdit.clipId) return
  for (const char of state.characters) {
    if (!char.visible) continue
    if (char.kind === 'fbx') drawFbxCharacter(char)
    else drawFramesCharacter(char)
  }
}

function drawFramesCharacter(char) {
  // Real-time clock so frames cycle smoothly even when the timeline is paused.
  const t = performance.now() / 1000
  const anim = pickActiveAnim(char)
  if (!anim || !anim.frames || !anim.frames.length) return
  const fps = Math.max(0.5, anim.fps || 10)
  const idx = Math.floor(t * fps) % anim.frames.length
  const frame = anim.frames[idx]
  if (!frame || !frame.image) return

  const pos = CHARACTER_POSITIONS[char.position] || CHARACTER_POSITIONS['bottom-right']
  const targetH = canvas.height * (char.scale || 0.4)
  const aspect = frame.image.width / Math.max(1, frame.image.height)
  const targetW = targetH * aspect
  const cx = pos.x * canvas.width
  const cy = pos.y * canvas.height
  const x = cx - pos.ax * targetW
  const y = cy - pos.ay * targetH
  ctx.drawImage(frame.image, x, y, targetW, targetH)
}

// --- 3D / FBX support ---

function isFBXFile(file) {
  return (
    /\.fbx$/i.test(file && file.name) || (file && file.type === 'application/octet-stream' && /\.fbx$/i.test(file.name))
  )
}

let _three = null
async function ensureThree() {
  if (_three) return _three
  // Dynamic import lets the importmap in index.html resolve "three" and
  // "three/addons/" to unpkg without bloating the initial page load.
  const [THREE, fbxMod] = await Promise.all([import('three'), import('three/addons/loaders/FBXLoader.js')])
  _three = { THREE, FBXLoader: fbxMod.FBXLoader }
  return _three
}

let _fbxRenderer = null
function getFbxRenderer(THREE) {
  if (_fbxRenderer && _fbxRenderer._three === THREE) return _fbxRenderer
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false })
  r.setClearColor(0x000000, 0)
  if ('outputColorSpace' in r) r.outputColorSpace = THREE.SRGBColorSpace
  r._three = THREE
  _fbxRenderer = r
  return r
}

// 1x1 transparent PNG. Used by the LoadingManager below to short-circuit
// any external texture fetches the FBXLoader tries to make - Mixamo and many
// other tools embed Windows-style or "invalid" texture paths that 404 in the
// browser, spamming "Failed to load resource: net::ERR_FAILED" and sometimes
// causing the FBXLoader to never resolve. Swapping in a 1x1 placeholder lets
// the model load with its default material visible.
const TRANSPARENT_PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

// Build an FBX-backed character from one or more FBX files. The first FBX
// supplies the rig + skin; every file (including the first) contributes its
// AnimationClips. This matches how Mixamo packs models + animation files.
async function buildFbxCharacterFromFiles(files) {
  const { THREE, FBXLoader } = await ensureThree()

  // Custom manager: any URL that isn't a data: URI is rewritten to a 1x1
  // transparent PNG so embedded "invalid" / Windows-path texture references
  // don't fail the load. We still log them so the user can see what's
  // missing if they want to fix the export.
  const manager = new THREE.LoadingManager()
  manager.setURLModifier((url) => {
    if (typeof url === 'string' && url.startsWith('data:')) return url
    if (url) console.warn('[fbx] suppressing external texture fetch:', url)
    return TRANSPARENT_PNG_DATA_URI
  })
  manager.onError = (url) => console.warn('[fbx] resource error (ignored):', url)

  const loader = new FBXLoader(manager)

  let baseGroup = null
  const allClips = []
  for (const file of files) {
    let group
    try {
      const buffer = await file.arrayBuffer()
      group = loader.parse(buffer, '')
    } catch (err) {
      console.warn('[fbx] parse failed for', file.name, err)
      continue
    }
    if (!baseGroup) baseGroup = group
    for (const clip of group.animations || []) {
      allClips.push({ clip, sourceName: file.name })
    }
  }
  if (!baseGroup) throw new Error('No FBX could be parsed (file may be corrupt or use an unsupported version).')

  // Center the model horizontally and put feet near the origin so the camera
  // framing below works regardless of the FBX's authored coordinate system.
  const bbox = new THREE.Box3().setFromObject(baseGroup)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  bbox.getSize(size)
  bbox.getCenter(center)
  baseGroup.position.x -= center.x
  baseGroup.position.z -= center.z
  baseGroup.position.y -= bbox.min.y

  const scene = new THREE.Scene()
  scene.add(baseGroup)
  scene.add(new THREE.AmbientLight(0xffffff, 0.65))
  const key = new THREE.DirectionalLight(0xffffff, 1.1)
  key.position.set(2, 5, 3)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xffffff, 0.4)
  fill.position.set(-2, 2, 4)
  scene.add(fill)

  // Frame the upper body so the speaker shot reads on a vertical canvas.
  const fov = 28
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, Math.max(2000, size.length() * 4))
  const focusY = size.y * 0.7
  const dist = (size.y / 2 / Math.tan(((fov / 2) * Math.PI) / 180)) * 1.4
  camera.position.set(0, focusY, dist)
  camera.lookAt(0, focusY * 0.85, 0)

  const mixer = new THREE.AnimationMixer(baseGroup)
  const animations = []
  const actions = new Map()
  for (const { clip, sourceName } of allClips) {
    const id = rid('a')
    const action = mixer.clipAction(clip)
    actions.set(id, action)
    const fallback = sourceName.replace(/\.fbx$/i, '')
    animations.push({ id, name: clip.name || fallback || 'clip ' + (animations.length + 1) })
  }
  if (!animations.length) {
    // Static pose - no clips in the file. Render still frames anyway.
    animations.push({ id: rid('a'), name: 'static' })
  }

  return {
    animations,
    fbx: { THREE, group: baseGroup, scene, camera, mixer, actions, lastUpdate: null, currentActionId: null },
  }
}

// Cross-fade to the animation we *should* be playing right now (talk if VO is
// active and a talk clip exists, otherwise the user-selected one). No-op when
// the right one is already active.
function ensureFbxActiveAction(char) {
  if (!char.fbx || !char.fbx.actions) return
  let targetId = char.activeAnimId
  if (state.playing && state.audio) {
    const talk = findTalkAnimation(char)
    if (talk) targetId = talk.id
  }
  if (!targetId || char.fbx.currentActionId === targetId) return
  for (const action of char.fbx.actions.values()) {
    if (action.isRunning && action.isRunning()) action.fadeOut(0.3)
  }
  const next = char.fbx.actions.get(targetId)
  if (next) {
    next.reset().setEffectiveWeight(1).fadeIn(0.3).play()
  }
  char.fbx.currentActionId = targetId
}

function drawFbxCharacter(char) {
  const fbx = char.fbx
  if (!fbx) return
  const { THREE, scene, camera, mixer } = fbx
  const renderer = getFbxRenderer(THREE)

  const pos = CHARACTER_POSITIONS[char.position] || CHARACTER_POSITIONS['bottom-right']
  const targetH = canvas.height * (char.scale || 0.55)
  const aspect = 0.6 // assume tall character; matches a typical 9:16 framing
  const targetW = targetH * aspect
  const cx = pos.x * canvas.width
  const cy = pos.y * canvas.height
  const x = cx - pos.ax * targetW
  const y = cy - pos.ay * targetH

  const W = Math.max(64, Math.min(1500, Math.floor(targetW)))
  const H = Math.max(64, Math.min(2000, Math.floor(targetH)))
  if (renderer.domElement.width !== W || renderer.domElement.height !== H) {
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
  }

  ensureFbxActiveAction(char)

  const now = performance.now() / 1000
  const last = fbx.lastUpdate || now
  const dt = Math.max(0, Math.min(0.1, now - last))
  fbx.lastUpdate = now
  if (mixer && dt > 0) mixer.update(dt)

  renderer.render(scene, camera)
  ctx.drawImage(renderer.domElement, x, y, targetW, targetH)
}

// Drive a low-rate redraw while the timeline is paused so characters animate
// in the preview. The normal play loop already redraws on every frame, so this
// only kicks in when state.playing is false.
let charPreviewRaf = null
function ensureCharPreviewLoop() {
  if (charPreviewRaf) return
  const tick = () => {
    if (state.playing) {
      charPreviewRaf = null
      return
    }
    const anyAnimating = state.characters.some((c) => c.visible && c.animations.length > 0)
    if (!anyAnimating) {
      charPreviewRaf = null
      return
    }
    draw()
    charPreviewRaf = requestAnimationFrame(tick)
  }
  charPreviewRaf = requestAnimationFrame(tick)
}

// Persist characters to localStorage as data URLs so they survive a reload.
// Best-effort: if the browser quota is hit we just skip - the user can
// re-upload next session. FBX-backed characters are NOT persisted (the raw
// model bytes blow past localStorage's ~5MB quota); they live for the session
// only and need to be re-uploaded after a refresh.
function persistCharacters() {
  try {
    const serialized = state.characters
      .filter((c) => c.kind !== 'fbx')
      .map((c) => ({
        id: c.id,
        name: c.name,
        visible: c.visible,
        position: c.position,
        scale: c.scale,
        activeAnimId: c.activeAnimId,
        kind: 'frames',
        animations: (c.animations || []).map((a) => ({
          id: a.id,
          name: a.name,
          fps: a.fps,
          frames: (a.frames || []).map((f) => ({ name: f.name, dataUrl: f.dataUrl })),
        })),
      }))
    localStorage.setItem('characters', JSON.stringify(serialized))
  } catch (err) {
    console.warn('[character] persist failed:', err && err.message)
  }
}

async function loadPersistedCharacters() {
  let raw = null
  try {
    raw = localStorage.getItem('characters')
  } catch (_) {
    return
  }
  if (!raw) return
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (_) {
    return
  }
  if (!Array.isArray(parsed)) return
  for (const c of parsed) {
    if (!c || !Array.isArray(c.animations)) continue
    const character = {
      id: c.id || rid('c'),
      name: typeof c.name === 'string' ? c.name : 'Character',
      visible: !!c.visible,
      position: CHARACTER_POSITIONS[c.position] ? c.position : 'bottom-right',
      scale: typeof c.scale === 'number' ? clamp(c.scale, 0.05, 1) : 0.45,
      activeAnimId: typeof c.activeAnimId === 'string' ? c.activeAnimId : null,
      kind: 'frames',
      animations: [],
    }
    for (const a of c.animations) {
      if (!a || !Array.isArray(a.frames)) continue
      const frames = []
      for (const f of a.frames) {
        if (!f || typeof f.dataUrl !== 'string') continue
        try {
          const image = await dataURLToImage(f.dataUrl)
          frames.push({ name: f.name || '', dataUrl: f.dataUrl, image })
        } catch (_) {}
      }
      if (!frames.length) continue
      character.animations.push({
        id: a.id || rid('a'),
        name: typeof a.name === 'string' ? a.name : 'animation',
        fps: typeof a.fps === 'number' ? clamp(a.fps, 0.5, 60) : 10,
        frames,
      })
    }
    if (character.animations.length && !character.activeAnimId) {
      character.activeAnimId = character.animations[0].id
    }
    if (character.animations.length) state.characters.push(character)
  }
  renderCharactersList()
  ensureCharPreviewLoop()
  draw()
}

// --- Adding characters / animations / frames ---

// Pending file-upload context. We swap the same hidden <input> between
// "create new character", "add animation to existing character", and "add
// frames to existing animation" by routing the change event through this.
let pendingUpload = null

function onCharacterFileChange(e) {
  const files = e.target.files
  e.target.value = '' // allow re-picking the same files later
  const ctx = pendingUpload
  pendingUpload = null
  if (!files || !files.length || !ctx) return
  ctx.onFiles(files).catch((err) => {
    console.warn('[character] upload failed:', err)
    alert('Could not load those files: ' + (err && err.message ? err.message : err))
  })
}

function pickFiles({ targetInput, onFiles }) {
  pendingUpload = { onFiles }
  targetInput.click()
}

// Inline status banner under the + Character button. Used in place of
// alerts/prompts (which Chrome silently suppresses after a file picker), so
// the user can always see what step the upload is on and what failed.
function setCharStatus(msg, kind) {
  const el = $('charStatus')
  if (!el) return
  if (!msg) {
    el.hidden = true
    el.textContent = ''
    el.className = 'char-status'
    return
  }
  el.hidden = false
  el.className = 'char-status' + (kind ? ' ' + kind : '')
  el.textContent = msg
}

async function addCharacterFromFiles(files) {
  const arr = Array.from(files)
  const fbxFiles = arr.filter(isFBXFile)
  const imageFiles = arr.filter((f) => !isFBXFile(f))
  setCharStatus(
    `Picked ${arr.length} file${arr.length === 1 ? '' : 's'} (${fbxFiles.length} FBX, ${imageFiles.length} image).`,
  )
  if (fbxFiles.length && imageFiles.length) {
    setCharStatus('Pick either image frames or FBX file(s), not a mix.', 'error')
    return
  }
  if (!fbxFiles.length && !imageFiles.length) {
    setCharStatus('No usable files were picked.', 'error')
    return
  }
  // Default name from the first file's stem; the card has an inline name field
  // for rename. We avoid prompt() because Chrome silently blocks it after a
  // file picker dialog ("Don't allow this page to create more dialogs"), which
  // looks to the user like the upload did nothing.
  const first = fbxFiles[0] || imageFiles[0]
  const stem = first ? first.name.replace(/\.[^.]+$/, '') : ''
  const finalName = stem || 'Character ' + (state.characters.length + 1)
  if (fbxFiles.length) {
    await addFbxCharacterFromFiles(finalName, fbxFiles)
  } else {
    await addFramesCharacter(finalName, imageFiles)
  }
}

async function addFramesCharacter(name, files) {
  const frames = await loadFilesAsFrames(files)
  if (!frames.length) {
    alert('No images could be loaded from those files.')
    return
  }
  const animId = rid('a')
  state.characters.push({
    id: rid('c'),
    name,
    visible: true,
    position: 'bottom-right',
    scale: 0.45,
    activeAnimId: animId,
    kind: 'frames',
    animations: [{ id: animId, name: 'idle', fps: 10, frames }],
  })
  renderCharactersList()
  persistCharacters()
  ensureCharPreviewLoop()
  draw()
}

async function addFbxCharacterFromFiles(name, files) {
  if (location.protocol === 'file:') {
    setCharStatus(
      'FBX needs http(s) - the page is on file://. Run "python3 -m http.server" in this folder and open http://localhost:8000/',
      'error',
    )
    return
  }
  const btn = $('addCharacterBtn')
  const prevText = btn ? btn.textContent : ''
  if (btn) {
    btn.disabled = true
    btn.textContent = 'Loading FBX...'
  }
  try {
    const sizeMb = (files[0]?.size || 0) / (1024 * 1024)
    setCharStatus(`Loading Three.js + parsing "${files[0]?.name || ''}" (${sizeMb.toFixed(2)} MB)...`)
    const built = await buildFbxCharacterFromFiles(files)
    const character = {
      id: rid('c'),
      name,
      visible: true,
      position: 'bottom-right',
      scale: 0.6,
      activeAnimId: built.animations[0]?.id || null,
      kind: 'fbx',
      animations: built.animations,
      fbx: built.fbx,
    }
    // Start the active action so the very first frame isn't a T-pose.
    const firstAction = character.activeAnimId ? built.fbx.actions.get(character.activeAnimId) : null
    if (firstAction) {
      firstAction.play()
      built.fbx.currentActionId = character.activeAnimId
    }
    state.characters.push(character)
    renderCharactersList()
    persistCharacters() // FBX skipped internally; kept for any frames-kind chars present
    ensureCharPreviewLoop()
    draw()
    setCharStatus(
      `Loaded "${name}" - ${built.animations.length} animation${
        built.animations.length === 1 ? '' : 's'
      }: ${built.animations.map((a) => a.name).join(', ')}`,
      'success',
    )
  } catch (err) {
    console.error('[fbx] character creation failed:', err)
    const msg = (err && err.message) || String(err)
    setCharStatus(
      'FBX load failed: ' +
        msg +
        '\n\nCheck:\n' +
        '- Page must be on http(s) (not file://)\n' +
        '- unpkg.com reachable (Three.js loads from there)\n' +
        '- Try re-exporting as FBX 7.4 binary if it is unsupported',
      'error',
    )
  } finally {
    if (btn) {
      btn.disabled = false
      btn.textContent = prevText || '+ Character'
    }
  }
}

async function addAnimationToCharacter(charId, files) {
  const char = findCharacter(charId)
  if (!char) return
  const arr = Array.from(files)
  const fbxFiles = arr.filter(isFBXFile)
  const imageFiles = arr.filter((f) => !isFBXFile(f))

  if (char.kind === 'fbx') {
    if (!fbxFiles.length) {
      alert('This character is FBX-based. Pick an FBX file with the new animation clip.')
      return
    }
    await addFbxAnimationsToCharacter(char, fbxFiles)
    return
  }

  if (fbxFiles.length) {
    alert('This character is frame-based. Pick image files for the new animation.')
    return
  }
  // Default to first file's stem - same reason as addCharacterFromFiles:
  // prompt() silently fails after a file picker, so derive the name from the
  // upload and let the user rename inline on the animation row.
  const stem = imageFiles[0] ? imageFiles[0].name.replace(/\.[^.]+$/, '') : ''
  const name = stem || 'animation'
  const frames = await loadFilesAsFrames(imageFiles)
  if (!frames.length) {
    alert('No images could be loaded from those files.')
    return
  }
  const anim = { id: rid('a'), name: name.trim() || 'animation', fps: 10, frames }
  char.animations.push(anim)
  if (!char.activeAnimId) char.activeAnimId = anim.id
  renderCharactersList()
  persistCharacters()
  ensureCharPreviewLoop()
  draw()
}

// Append AnimationClips from one or more FBX files to an existing FBX
// character. Assumes the rigs are compatible (Mixamo-style: same skeleton).
async function addFbxAnimationsToCharacter(char, files) {
  if (!char.fbx) return
  const { FBXLoader } = await ensureThree()
  const loader = new FBXLoader()
  const btn = $('addCharacterBtn')
  const prev = btn ? btn.textContent : ''
  if (btn) {
    btn.disabled = true
    btn.textContent = 'Loading FBX...'
  }
  try {
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer()
        const group = loader.parse(buffer, '')
        for (const clip of group.animations || []) {
          const id = rid('a')
          const action = char.fbx.mixer.clipAction(clip)
          char.fbx.actions.set(id, action)
          const fallback = file.name.replace(/\.fbx$/i, '')
          char.animations.push({ id, name: clip.name || fallback || 'clip ' + (char.animations.length + 1) })
        }
      } catch (err) {
        console.warn('[fbx] animation load failed for', file.name, err)
      }
    }
    if (!char.activeAnimId && char.animations.length) char.activeAnimId = char.animations[0].id
    renderCharactersList()
    draw()
  } finally {
    if (btn) {
      btn.disabled = false
      btn.textContent = prev || '+ Character'
    }
  }
}

async function addFramesToAnimation(charId, animId, files) {
  const char = findCharacter(charId)
  if (!char) return
  const anim = findAnimation(char, animId)
  if (!anim) return
  const frames = await loadFilesAsFrames(files)
  if (!frames.length) return
  anim.frames.push(...frames)
  renderCharactersList()
  persistCharacters()
  draw()
}

function removeAnimation(charId, animId) {
  const char = findCharacter(charId)
  if (!char) return
  char.animations = char.animations.filter((a) => a.id !== animId)
  if (char.activeAnimId === animId) {
    char.activeAnimId = char.animations[0]?.id || null
  }
  renderCharactersList()
  persistCharacters()
  draw()
}

function removeCharacter(charId) {
  const char = findCharacter(charId)
  if (char && char.kind === 'fbx' && char.fbx) {
    try {
      char.fbx.mixer.stopAllAction()
      char.fbx.scene.traverse((obj) => {
        if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          for (const m of mats) {
            if (m && m.dispose) m.dispose()
          }
        }
      })
    } catch (err) {
      console.warn('[fbx] dispose failed:', err)
    }
  }
  state.characters = state.characters.filter((c) => c.id !== charId)
  renderCharactersList()
  persistCharacters()
  draw()
}

// --- UI ---

function renderCharactersList() {
  const root = $('charactersList')
  if (!root) return
  root.innerHTML = ''
  $('charactersHint').style.display = state.characters.length ? 'none' : ''

  for (const char of state.characters) {
    const isFbx = char.kind === 'fbx'
    const card = document.createElement('div')
    card.className = 'character-card' + (char.visible ? ' visible' : '') + (isFbx ? ' fbx' : '')

    // Top row: thumb + name + delete.
    const row = document.createElement('div')
    row.className = 'char-row'

    let thumb
    if (isFbx) {
      thumb = document.createElement('div')
      thumb.className = 'char-thumb fbx-badge'
      thumb.textContent = '3D'
    } else {
      thumb = document.createElement('img')
      thumb.className = 'char-thumb'
      const firstFrame = char.animations[0]?.frames?.[0]
      if (firstFrame) thumb.src = firstFrame.dataUrl
    }

    const meta = document.createElement('div')
    meta.className = 'char-meta'

    const nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.value = char.name
    nameInput.addEventListener('input', (e) => {
      char.name = e.target.value
      persistCharacters()
    })

    const showLabel = document.createElement('label')
    showLabel.className = 'show-toggle'
    const showCheck = document.createElement('input')
    showCheck.type = 'checkbox'
    showCheck.checked = !!char.visible
    showCheck.addEventListener('change', (e) => {
      char.visible = e.target.checked
      renderCharactersList()
      persistCharacters()
      ensureCharPreviewLoop()
      draw()
    })
    const showText = document.createElement('span')
    showText.textContent = 'Show in video'
    showLabel.append(showCheck, showText)

    meta.append(nameInput, showLabel)

    const actions = document.createElement('div')
    actions.className = 'char-actions'
    const rmBtn = document.createElement('button')
    rmBtn.type = 'button'
    rmBtn.className = 'remove'
    rmBtn.textContent = '×'
    rmBtn.title = 'Remove character'
    rmBtn.addEventListener('click', () => removeCharacter(char.id))
    actions.append(rmBtn)

    row.append(thumb, meta, actions)
    card.append(row)

    // Position + scale controls.
    const ctrlRow = document.createElement('div')
    ctrlRow.className = 'ctrl-row'

    const posLabel = document.createElement('label')
    posLabel.textContent = 'Position'
    const posSelect = document.createElement('select')
    for (const [key, def] of Object.entries(CHARACTER_POSITIONS)) {
      const opt = document.createElement('option')
      opt.value = key
      opt.textContent = def.label
      if (char.position === key) opt.selected = true
      posSelect.appendChild(opt)
    }
    posSelect.addEventListener('change', (e) => {
      char.position = e.target.value
      persistCharacters()
      draw()
    })
    posLabel.appendChild(posSelect)

    const sizeLabel = document.createElement('label')
    sizeLabel.textContent = 'Size (% of height)'
    const sizeInput = document.createElement('input')
    sizeInput.type = 'number'
    sizeInput.min = '5'
    sizeInput.max = '100'
    sizeInput.step = '1'
    sizeInput.value = String(Math.round((char.scale || 0.45) * 100))
    sizeInput.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value) || 45
      char.scale = clamp(v / 100, 0.05, 1)
      persistCharacters()
      draw()
    })
    sizeLabel.appendChild(sizeInput)

    ctrlRow.append(posLabel, sizeLabel)
    card.append(ctrlRow)

    // Animations list.
    const animList = document.createElement('div')
    animList.className = 'anim-list'

    for (const anim of char.animations) {
      const aRow = document.createElement('div')
      aRow.className = 'anim-row'

      const radioWrap = document.createElement('label')
      radioWrap.className = 'anim-radio'
      radioWrap.title = 'Make this the active animation'
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.name = 'active-anim-' + char.id
      radio.checked = char.activeAnimId === anim.id
      radio.addEventListener('change', () => {
        char.activeAnimId = anim.id
        persistCharacters()
        draw()
      })
      radioWrap.appendChild(radio)

      const nameIn = document.createElement('input')
      nameIn.type = 'text'
      nameIn.value = anim.name
      nameIn.title = 'Animations starting with "talk" or "speak" auto-play during voiceover'
      nameIn.addEventListener('input', (e) => {
        anim.name = e.target.value
        persistCharacters()
      })

      let fpsIn = null
      if (!isFbx) {
        fpsIn = document.createElement('input')
        fpsIn.type = 'number'
        fpsIn.min = '0.5'
        fpsIn.max = '60'
        fpsIn.step = '0.5'
        fpsIn.title = 'Frames per second'
        fpsIn.value = String(anim.fps)
        fpsIn.addEventListener('input', (e) => {
          const v = parseFloat(e.target.value) || 10
          anim.fps = clamp(v, 0.5, 60)
          persistCharacters()
        })
      } else {
        // Spacer to keep grid alignment for FBX rows (mixer drives the speed).
        fpsIn = document.createElement('span')
        fpsIn.className = 'fps-spacer'
        fpsIn.textContent = ''
      }

      const rm = document.createElement('button')
      rm.type = 'button'
      rm.className = 'anim-remove'
      rm.textContent = '×'
      rm.title = 'Remove animation'
      rm.addEventListener('click', () => removeAnimation(char.id, anim.id))

      aRow.append(radioWrap, nameIn, fpsIn, rm)
      animList.append(aRow)

      if (!isFbx) {
        const fc = document.createElement('div')
        fc.className = 'frame-count'
        fc.style.fontSize = '10px'
        fc.style.color = 'var(--muted)'
        fc.style.padding = '0 4px 2px'
        fc.textContent = `${anim.frames.length} frame${anim.frames.length === 1 ? '' : 's'}`
        const addFramesBtn = document.createElement('button')
        addFramesBtn.type = 'button'
        addFramesBtn.className = 'anim-add'
        addFramesBtn.textContent = '+ frames'
        addFramesBtn.addEventListener('click', () => {
          pickFiles({
            targetInput: $('animationFileInput'),
            onFiles: (files) => addFramesToAnimation(char.id, anim.id, files),
          })
        })
        const fcRow = document.createElement('div')
        fcRow.style.display = 'flex'
        fcRow.style.justifyContent = 'space-between'
        fcRow.style.alignItems = 'center'
        fcRow.style.marginBottom = '2px'
        fcRow.append(fc, addFramesBtn)
        animList.append(fcRow)
      }
    }

    const addAnimBtn = document.createElement('button')
    addAnimBtn.type = 'button'
    addAnimBtn.className = 'anim-add'
    addAnimBtn.textContent = isFbx ? '+ animation FBX' : '+ animation'
    addAnimBtn.addEventListener('click', () => {
      pickFiles({
        targetInput: $('animationFileInput'),
        onFiles: (files) => addAnimationToCharacter(char.id, files),
      })
    })
    animList.append(addAnimBtn)

    card.append(animList)
    root.append(card)
  }
}

// Bindings.
$('addCharacterBtn').addEventListener('click', () => {
  pickFiles({
    targetInput: $('characterFileInput'),
    onFiles: addCharacterFromFiles,
  })
})
$('characterFileInput').addEventListener('change', onCharacterFileChange)
$('animationFileInput').addEventListener('change', onCharacterFileChange)

// Hydrate persisted characters last so the canvas exists and styles are loaded.
loadPersistedCharacters().catch((err) => console.warn('[character] hydrate failed:', err))
renderCharactersList()

draw()
