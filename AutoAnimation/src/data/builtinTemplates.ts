/**
 * Built-in HTML motion graphics templates for the Library.
 *
 * Each entry describes a template. The actual HTML content is loaded
 * from the /src/data/templates/*.html files at build time via
 * Vite's `?raw` import.
 *
 * Call `seedBuiltinTemplates()` once at app startup to populate the
 * marketplace store with any templates the user hasn't yet seen.
 */

import { useMarketplaceStore, builtinTemplateIds, type MarketplaceCategory } from '@/stores/useMarketplaceStore'
import { MEME_TEMPLATES } from './memeTemplates'

export interface BuiltinTemplate {
  id: string
  title: string
  description: string
  filename: string          // e.g. "neural-noir.html"
  tags: string[]
  category?: MarketplaceCategory  // defaults to 'html-templates' if omitted
}

// ── Template catalog ─────────────────────────────────────────────────

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  // ── UI Styles ──────────────────────────────────────────────────────
  { id: 'tpl-neural-noir',       title: 'Neural Noir',               description: 'Dark-mode gold-on-black glassmorphism with floating cards and gold particles', filename: 'neural-noir.html', tags: ['ui', 'dark', 'gold', 'glass'] },
  { id: 'tpl-news-print',        title: 'News Print',                description: 'High-contrast newspaper typography with typewriter headlines and column layout', filename: 'news-print.html', tags: ['ui', 'editorial', 'typography'] },
  { id: 'tpl-neumorphism',       title: 'Neumorphism',               description: 'Soft extruded UI elements with dual shadows on cool grey surface', filename: 'neumorphism.html', tags: ['ui', 'soft', 'minimal'] },
  { id: 'tpl-win98',             title: 'Win98',                     description: 'Retro Windows 98 desktop with beveled buttons, taskbar, and error dialogs', filename: 'win98.html', tags: ['ui', 'retro', '90s'] },
  { id: 'tpl-luxury',            title: 'Luxury',                    description: 'Elegant black and gold with serif typography and diamond particles', filename: 'luxury.html', tags: ['ui', 'luxury', 'gold', 'elegant'] },
  { id: 'tpl-bauhaus',           title: 'Bauhaus',                   description: 'Bold primary colors with geometric shapes and thick black borders', filename: 'bauhaus.html', tags: ['ui', 'geometric', 'bold'] },
  { id: 'tpl-terminal',          title: 'Terminal',                  description: 'Green-on-black terminal with typing commands and matrix rain', filename: 'terminal.html', tags: ['ui', 'tech', 'hacker', 'terminal'] },
  { id: 'tpl-swiss-style',       title: 'Swiss Style',               description: 'Grid-based Black/White/Red Helvetica design with counting numbers', filename: 'swiss-style.html', tags: ['ui', 'minimal', 'grid'] },
  { id: 'tpl-clay-ui',           title: 'Clay UI',                   description: 'Candy-colored soft clay elements with bouncy animations and blob shapes', filename: 'clay-ui.html', tags: ['ui', 'soft', 'pastel', 'playful'] },
  { id: 'tpl-liquid-metal',      title: 'Liquid Metal',              description: 'Chrome gradients with neon glow, glitch effects, and morphing blobs', filename: 'liquid-metal.html', tags: ['ui', 'chrome', 'neon', 'glitch'] },
  { id: 'tpl-gorpcore',          title: 'Gorpcore',                  description: 'Rugged outdoor technical style with topographic lines and coordinates', filename: 'gorpcore.html', tags: ['ui', 'outdoor', 'technical'] },
  { id: 'tpl-grunge-collage',    title: 'Grunge Collage',            description: 'Raw punk aesthetic with torn paper, distressed textures, and chaotic layering', filename: 'grunge-collage.html', tags: ['ui', 'grunge', 'punk', 'collage'] },
  { id: 'tpl-bold-retro',        title: 'Bold Retro-Modernism',      description: 'Heavy retro typography with thick borders and halftone patterns', filename: 'bold-retro.html', tags: ['ui', 'retro', 'bold', 'editorial'] },
  { id: 'tpl-synapse',           title: 'Synapse',                   description: 'Neural network visualization with pulsing connections on vantablack', filename: 'synapse.html', tags: ['ui', 'neural', 'dark', 'futuristic'] },
  { id: 'tpl-glassmorphism-card', title: 'Glassmorphism Card',       description: 'Frosted glass cards on dark background with emerald highlights', filename: 'glassmorphism-card.html', tags: ['ui', 'glass', 'emerald', 'blur'] },
  { id: 'tpl-clean-fluid',       title: 'Clean Fluid',               description: 'Editorial typography with fluid gradient blobs and clean transitions', filename: 'clean-fluid.html', tags: ['ui', 'editorial', 'fluid', 'clean'] },
  { id: 'tpl-organic-modern',    title: 'Organic Modern',            description: 'Warm earth tones with serif headings and botanical elements', filename: 'organic-modern.html', tags: ['ui', 'organic', 'warm', 'nature'] },
  { id: 'tpl-cyber-serif',       title: 'Cyber Serif',               description: 'Classical serif meets tech with emerald accents and data streams', filename: 'cyber-serif.html', tags: ['ui', 'cyber', 'serif', 'tech'] },
  { id: 'tpl-dark-avant-garde',  title: 'Dark Avant-Garde',          description: 'Deep black with lime accents and dramatic serif typography', filename: 'dark-avant-garde.html', tags: ['ui', 'dark', 'lime', 'editorial'] },
  { id: 'tpl-neo-brutalism',     title: 'Neo-Brutalism',             description: 'Acid colors with hard shadows, thick borders, and bouncy physics', filename: 'neo-brutalism.html', tags: ['ui', 'brutalist', 'acid', 'bold'] },
  { id: 'tpl-red-noir',          title: 'Red Noir',                  description: 'Black with bold red accent lines and film noir grain', filename: 'red-noir.html', tags: ['ui', 'noir', 'red', 'dramatic'] },
  { id: 'tpl-glassmorphism-lime', title: 'Glassmorphism Lime',       description: 'Obsidian background with lime accents and frosted data cards', filename: 'glassmorphism-lime.html', tags: ['ui', 'glass', 'lime', 'dark'] },
  { id: 'tpl-cinematic-noir',    title: 'Cinematic Noir',            description: 'Monochrome with red highlight, film grain, and letterboxing', filename: 'cinematic-noir.html', tags: ['ui', 'cinematic', 'noir', 'film'] },
  { id: 'tpl-bold-editorial',    title: 'Bold Editorial Studio',     description: 'Black and white large typography with cursor trail and grid reveals', filename: 'bold-editorial.html', tags: ['ui', 'editorial', 'bold', 'bw'] },
  { id: 'tpl-midnight-editorial', title: 'Midnight Editorial',       description: 'Paper background with forest green and botanical decorations', filename: 'midnight-editorial.html', tags: ['ui', 'editorial', 'green', 'elegant'] },
  { id: 'tpl-cinematic-landing', title: 'Cinematic Landing',         description: 'Cinematic slow-motion with parallax depth and gradient overlays', filename: 'cinematic-landing.html', tags: ['ui', 'cinematic', 'parallax'] },
  { id: 'tpl-minimalist-beta',   title: 'Minimalist Beta Capture',   description: 'Dark minimal with countdown timer and beta badge', filename: 'minimalist-beta.html', tags: ['ui', 'minimal', 'startup', 'beta'] },
  { id: 'tpl-neon-velocity',     title: 'Neon Velocity Countdown',   description: 'Neon lime on black with speed lines and kinetic typography', filename: 'neon-velocity.html', tags: ['ui', 'neon', 'speed', 'countdown'] },
  { id: 'tpl-softly-wellness',   title: 'Softly Wellness',           description: 'Soft pastels with breathing circle and gentle floating bubbles', filename: 'softly-wellness.html', tags: ['ui', 'pastel', 'wellness', 'calm'] },
  { id: 'tpl-futuristic-saas',   title: 'Futuristic SaaS',           description: 'Dark atmospheric glassmorphism with indigo glow and dashboard metrics', filename: 'futuristic-saas.html', tags: ['ui', 'saas', 'dashboard', 'futuristic'] },

  // ── Educational ────────────────────────────────────────────────────
  { id: 'tpl-world-map',         title: 'World Map',                 description: 'Interactive Earth terrain map with D3.js. Supports frame-synced commands: zoomToCountry, highlightCountry, drawConnection (animated arcs between countries), showLabel, hideUI. AI can control camera zoom/pan and highlight countries by name. Biome-colored terrain with tooltips.', filename: 'world-map.html', tags: ['education', 'geography', 'globe', 'terrain', 'earth', 'd3', 'map', 'geopolitics', 'countries'] },
  { id: 'tpl-solar-system',      title: 'Solar System',              description: 'Planets orbiting with twinkling stars and asteroid belt', filename: 'solar-system.html', tags: ['education', 'space', 'planets'] },
  { id: 'tpl-periodic-table',    title: 'Periodic Table',            description: 'Element grid with glowing highlights and electron orbits', filename: 'periodic-table.html', tags: ['education', 'chemistry', 'science'] },
  { id: 'tpl-timeline-history',  title: 'Timeline / History',        description: 'Scrolling horizontal timeline with event cards and era transitions', filename: 'timeline-history.html', tags: ['education', 'history', 'timeline'] },
  { id: 'tpl-math-equations',    title: 'Math Equations',            description: 'Self-writing equations, plotting graphs, and morphing shapes', filename: 'math-equations.html', tags: ['education', 'math', 'equations'] },
  { id: 'tpl-math-coordinate-plane', title: 'Math Coordinate Plane', description: 'Animated 2D coordinate system with function plotting, vectors, points, parametric curves, and shaded areas. Supports frame-synced draw-on animations. CONFIG: xRange, yRange, functions (array of {expr, color, label}), vectors (array of {from, to, color, label}), points (array of {x, y, color, label}), shapes (circle/line/rect/area), parametric (array of {x, y, tRange, color}), annotations, title.', filename: 'math-coordinate-plane.html', tags: ['education', 'math', 'graphing', 'functions', 'vectors', 'coordinate', 'algebra', 'calculus'] },
  { id: 'tpl-math-matrix-transform', title: 'Math Matrix Transform', description: 'Visualize 2x2 matrix transformations on geometric shapes. Shows unit circle/square morphing under linear transformation with animated grid deformation, basis vectors, eigenvectors, and determinant. CONFIG: matrix (2x2 array), shape (unit-circle/unit-square/house), showEigenvectors, showDeterminant, showBasisVectors, showTransformedGrid, colors.', filename: 'math-matrix-transform.html', tags: ['education', 'math', 'linear-algebra', 'matrix', 'transformation', 'eigenvectors', 'vectors'] },
  { id: 'tpl-math-equation-steps', title: 'Math Equation Steps', description: 'Step-by-step equation derivation with write-on animation, term highlighting, step labels, and progress dots. For algebraic proofs, derivations, and formula explanations. CONFIG: steps (array of {equation, label, highlight}), title, fontSize, animationStyle (write-on/fade), showStepNumbers, showStepLabels, secondsPerStep.', filename: 'math-equation-steps.html', tags: ['education', 'math', 'equations', 'derivation', 'proof', 'algebra', 'steps'] },
  { id: 'tpl-dna-helix',         title: 'DNA Helix',                 description: 'Rotating 3D double helix with genetic code and particles', filename: 'dna-helix.html', tags: ['education', 'biology', 'dna'] },

  // ── Business / Finance ─────────────────────────────────────────────
  { id: 'tpl-stock-charts',      title: 'Stock Charts',              description: 'Trading terminal with candlestick chart and scrolling ticker', filename: 'stock-charts.html', tags: ['business', 'finance', 'trading'] },
  { id: 'tpl-city-skyline',      title: 'City Skyline',              description: 'Night cityscape with blinking windows and construction crane', filename: 'city-skyline.html', tags: ['business', 'city', 'corporate'] },
  { id: 'tpl-money-flow',        title: 'Money Flow',                description: 'Floating dollar signs, growth arrows, and animated charts', filename: 'money-flow.html', tags: ['business', 'finance', 'growth'] },
  { id: 'tpl-calendar-schedule', title: 'Calendar / Schedule',       description: 'Calendar grid with appointments sliding in and clock rotating', filename: 'calendar-schedule.html', tags: ['business', 'productivity', 'calendar'] },
  { id: 'tpl-org-chart',         title: 'Org Chart',                 description: 'Hierarchical tree with nodes appearing and connections drawing', filename: 'org-chart.html', tags: ['business', 'organization', 'team'] },

  // ── Infographic Charts ──────────────────────────────────────────────
  { id: 'tpl-infographic-bar',        title: 'Bar Chart',            description: 'Animated bar chart for comparisons and rankings with grow-up reveal',                           filename: 'infographic-bar-chart.html',    tags: ['infographic', 'chart', 'bar', 'comparison', 'data'] },
  { id: 'tpl-infographic-line',       title: 'Line Chart',           description: 'Smooth line chart for time-series trends with draw-on animation',                              filename: 'infographic-line-chart.html',   tags: ['infographic', 'chart', 'line', 'trend', 'data'] },
  { id: 'tpl-infographic-stacked',    title: 'Stacked Bar Chart',    description: 'Stacked bars showing composition and comparison across categories',                            filename: 'infographic-stacked-bar.html',  tags: ['infographic', 'chart', 'stacked', 'composition', 'data'] },
  { id: 'tpl-infographic-donut',      title: 'Donut Chart',          description: 'Pie/donut chart with sweeping arc animation for part-to-whole data',                           filename: 'infographic-donut-chart.html',  tags: ['infographic', 'chart', 'donut', 'pie', 'data'] },
  { id: 'tpl-infographic-area',       title: 'Area Chart',           description: 'Filled area chart for cumulative trends with gradient fill',                                   filename: 'infographic-area-chart.html',   tags: ['infographic', 'chart', 'area', 'trend', 'data'] },
  { id: 'tpl-infographic-scatter',    title: 'Scatter Plot',         description: 'Scatter plot for correlations with category-colored dots',                                     filename: 'infographic-scatter-plot.html', tags: ['infographic', 'chart', 'scatter', 'correlation', 'data'] },
  { id: 'tpl-infographic-bubble',     title: 'Bubble Chart',         description: 'Bubble chart for 3-variable comparison with size encoding',                                   filename: 'infographic-bubble-chart.html', tags: ['infographic', 'chart', 'bubble', 'comparison', 'data'] },
  { id: 'tpl-infographic-histogram',  title: 'Histogram',            description: 'Auto-binned histogram for distributions with mean/median lines',                              filename: 'infographic-histogram.html',    tags: ['infographic', 'chart', 'histogram', 'distribution', 'data'] },
  { id: 'tpl-infographic-heatmap',    title: 'Heatmap',              description: 'Color-intensity grid for pattern detection with diagonal reveal',                              filename: 'infographic-heatmap.html',      tags: ['infographic', 'chart', 'heatmap', 'matrix', 'data'] },
  { id: 'tpl-infographic-treemap',    title: 'Treemap',              description: 'Hierarchical rectangles for part-to-whole with nested categories',                             filename: 'infographic-treemap.html',      tags: ['infographic', 'chart', 'treemap', 'hierarchy', 'data'] },
  { id: 'tpl-infographic-sankey',     title: 'Sankey Diagram',       description: 'Flow diagram showing weighted connections between nodes',                                     filename: 'infographic-sankey.html',       tags: ['infographic', 'chart', 'sankey', 'flow', 'data'] },
  { id: 'tpl-infographic-choropleth', title: 'Choropleth Map',       description: 'World map with countries colored by data values',                                              filename: 'infographic-choropleth.html',   tags: ['infographic', 'chart', 'map', 'geographic', 'data'] },
  { id: 'tpl-infographic-gantt',      title: 'Gantt Chart',          description: 'Project timeline with task bars, groups, and today marker',                                    filename: 'infographic-gantt.html',        tags: ['infographic', 'chart', 'gantt', 'timeline', 'data'] },
  { id: 'tpl-infographic-kpi',        title: 'KPI Dashboard',        description: 'Performance metrics with animated circular gauges and count-up numbers',                       filename: 'infographic-kpi.html',          tags: ['infographic', 'chart', 'kpi', 'dashboard', 'data'] },
  { id: 'tpl-infographic-lollipop',   title: 'Lollipop Chart',       description: 'Ranked lollipop chart — cleaner alternative to bar charts for rankings',                       filename: 'infographic-lollipop.html',     tags: ['infographic', 'chart', 'lollipop', 'ranking', 'data'] },

  // ── Tech / Coding ──────────────────────────────────────────────────
  { id: 'tpl-terminal-window',   title: 'Terminal Window',           description: 'Mac terminal with commands typing and output scrolling', filename: 'terminal-window.html', tags: ['tech', 'terminal', 'cli'] },
  { id: 'tpl-code-editor',       title: 'Code Editor',               description: 'VS Code-style editor with syntax-highlighted code typing', filename: 'code-editor.html', tags: ['tech', 'code', 'vscode'] },
  { id: 'tpl-leetcode-explainer', title: 'LeetCode Explainer',       description: 'VS Code editor with LeetCode problem card, typing code animation, and complexity analysis badge for coding tutorial videos', filename: 'leetcode-explainer.html', tags: ['tech', 'code', 'leetcode', 'tutorial', 'coding', 'algorithm'] },
  { id: 'tpl-circuit-board',     title: 'Circuit Board',             description: 'PCB traces with data flowing and LED indicators blinking', filename: 'circuit-board.html', tags: ['tech', 'hardware', 'circuit'] },
  { id: 'tpl-server-rack',       title: 'Server Rack',               description: 'Data center rack with blinking LEDs and data packets', filename: 'server-rack.html', tags: ['tech', 'server', 'datacenter'] },
  { id: 'tpl-browser-window',    title: 'Browser Window',            description: 'Chrome-style browser with page loading and UI interactions', filename: 'browser-window.html', tags: ['tech', 'browser', 'web'] },

  // ── News / Media ───────────────────────────────────────────────────
  { id: 'tpl-newspaper-layout',  title: 'Newspaper Layout',          description: 'Paper-style layout with typewriter headlines and columns filling', filename: 'newspaper-layout.html', tags: ['news', 'editorial', 'newspaper'] },
  { id: 'tpl-breaking-news',     title: 'Breaking News',             description: 'Red alert banner, scrolling ticker, and LIVE indicator', filename: 'breaking-news.html', tags: ['news', 'breaking', 'live', 'tv'] },
  { id: 'tpl-social-media-feed', title: 'Social Media Feed',         description: 'Scrolling social posts with likes, comments, and floating hearts', filename: 'social-media-feed.html', tags: ['news', 'social', 'feed'] },
  { id: 'tpl-tv-studio',         title: 'TV Studio',                 description: 'Broadcast graphics with lower thirds and ON AIR indicator', filename: 'tv-studio.html', tags: ['news', 'tv', 'broadcast'] },

  // ── Articles & News (Social / Web) ──────────────────────────────────
  { id: 'tpl-medium-article',      title: 'Medium Article',             description: 'Clean Medium blog post with serif typography, author byline, hero image, pull quote, and clap counter', filename: 'medium-article.html', tags: ['news', 'article', 'medium', 'blog'] },
  { id: 'tpl-google-search-result', title: 'Google Search Result',      description: 'Dark mode Google search with typing animation, featured snippet, organic results, and People Also Ask', filename: 'google-search-result.html', tags: ['news', 'google', 'search', 'web'] },
  { id: 'tpl-google-news-feed',    title: 'Google News Feed',           description: 'Google News mobile layout with top story card, source badges, and scrolling news list', filename: 'google-news-feed.html', tags: ['news', 'google', 'feed', 'mobile'] },
  { id: 'tpl-twitter-x-post',      title: 'X / Twitter Post',          description: 'X (Twitter) post with verified badge, engagement stats, image card, and reply thread', filename: 'twitter-x-post.html', tags: ['news', 'social', 'twitter', 'x'] },
  { id: 'tpl-instagram-post',      title: 'Instagram Post',            description: 'Instagram feed post with stories row, image, heart animation, captions, hashtags, and comments', filename: 'instagram-post.html', tags: ['news', 'social', 'instagram', 'photo'] },
  { id: 'tpl-facebook-post',       title: 'Facebook Post',             description: 'Facebook post with link preview card, reaction emojis, comment bubbles, and share bar', filename: 'facebook-post.html', tags: ['news', 'social', 'facebook', 'link'] },
  { id: 'tpl-reddit-post',         title: 'Reddit Post',               description: 'Reddit post with vote arrows, subreddit header, flair badge, nested comments, and upvote animation', filename: 'reddit-post.html', tags: ['news', 'social', 'reddit', 'discussion'] },
  { id: 'tpl-news-article-page',   title: 'News Article Page',         description: 'Premium news article with masthead, hero image, drop cap, byline, pull quote, and share bar', filename: 'news-article-page.html', tags: ['news', 'article', 'editorial', 'longform'] },
  { id: 'tpl-x-thread',            title: 'X / Twitter Thread',        description: 'Multi-tweet thread with connecting line, numbered posts, verified author, and staggered reveal animation', filename: 'x-thread.html', tags: ['news', 'social', 'twitter', 'thread'] },
  { id: 'tpl-news-aggregator',     title: 'News Aggregator App',       description: 'Mobile news app with trending cards, numbered latest articles, category chips, and bottom navigation', filename: 'news-aggregator.html', tags: ['news', 'app', 'aggregator', 'mobile'] },

  // ── Gaming / Entertainment ─────────────────────────────────────────
  { id: 'tpl-retro-arcade',      title: 'Retro Arcade',              description: 'Pixel art 8-bit aesthetic with INSERT COIN and space invaders', filename: 'retro-arcade.html', tags: ['gaming', 'retro', '8bit', 'arcade'] },
  { id: 'tpl-controller-layout', title: 'Controller Layout',         description: 'Gamepad with button prompts lighting up and combo sequences', filename: 'controller-layout.html', tags: ['gaming', 'controller', 'esports'] },
  { id: 'tpl-leaderboard',       title: 'Leaderboard',               description: 'Esports rankings with scores counting and positions shifting', filename: 'leaderboard.html', tags: ['gaming', 'esports', 'leaderboard'] },
  { id: 'tpl-hud-overlay',       title: 'HUD Overlay',               description: 'Game HUD with health bar, mini-map, ammo counter, and crosshair', filename: 'hud-overlay.html', tags: ['gaming', 'hud', 'fps', 'overlay'] },

  // ── Lifestyle ──────────────────────────────────────────────────────
  { id: 'tpl-kitchen-counter',   title: 'Kitchen Counter',           description: 'Warm kitchen with ingredients appearing and recipe card', filename: 'kitchen-counter.html', tags: ['lifestyle', 'food', 'cooking'] },
  { id: 'tpl-gym-fitness',       title: 'Gym Fitness',               description: 'Dark gym aesthetic with heart rate monitor and rep counter', filename: 'gym-fitness.html', tags: ['lifestyle', 'fitness', 'gym'] },
  { id: 'tpl-real-estate',       title: 'Real Estate Floor Plan',    description: 'Self-drawing floor plan with furniture and measurements', filename: 'real-estate.html', tags: ['lifestyle', 'realestate', 'floorplan'] },
  { id: 'tpl-travel-passport',   title: 'Travel Passport',           description: 'Passport with stamps appearing and airplane flying across', filename: 'travel-passport.html', tags: ['lifestyle', 'travel', 'passport'] },
  { id: 'tpl-weather-forecast',  title: 'Weather Forecast',          description: 'Animated sky with sun, clouds, rain, and temperature changes', filename: 'weather-forecast.html', tags: ['lifestyle', 'weather', 'forecast'] },

  // ── Kinetic Typography / Captions ─────────────────────────────────────
  { id: 'tpl-kinetic-impact-burst',    title: 'Kinetic Impact Burst',    description: 'Words slam in from random directions with screen shake, sparks, and elastic easing', filename: 'kinetic-impact-burst.html', tags: ['kinetic', 'typography', 'impact', 'motion'], category: 'captions' },
  { id: 'tpl-kinetic-neon-wave',       title: 'Kinetic Neon Wave',       description: 'Flowing words with neon glow trails, sine wave motion, and light streak particles', filename: 'kinetic-neon-wave.html', tags: ['kinetic', 'typography', 'neon', 'glow'], category: 'captions' },
  { id: 'tpl-kinetic-glitch-slam',     title: 'Kinetic Glitch Slam',     description: 'Cyberpunk glitch text with RGB split, scan lines, text scramble, and digital noise', filename: 'kinetic-glitch-slam.html', tags: ['kinetic', 'typography', 'glitch', 'cyber'], category: 'captions' },
  { id: 'tpl-kinetic-cinematic-reveal', title: 'Kinetic Cinematic Reveal', description: 'Movie trailer style reveals with letterbox bars, film grain, and gold sweep lines', filename: 'kinetic-cinematic-reveal.html', tags: ['kinetic', 'typography', 'cinematic', 'trailer'], category: 'captions' },
  { id: 'tpl-kinetic-street-poster',   title: 'Kinetic Street Poster',   description: 'Urban wheat-pasted poster collage with mixed fonts, tape strips, and stamp animations', filename: 'kinetic-street-poster.html', tags: ['kinetic', 'typography', 'street', 'urban'], category: 'captions' },
  { id: 'tpl-kinetic-gravity-drop',    title: 'Kinetic Gravity Drop',    description: 'Words drop from above with realistic gravity physics, bouncing on an invisible floor with dust particles, then tilting slide-off', filename: 'kinetic-gravity-drop.html', tags: ['kinetic', 'typography', 'gravity', 'physics', 'bounce'], category: 'captions' },
  { id: 'tpl-kinetic-typewriter-cascade', title: 'Kinetic Typewriter Cascade', description: 'Monospace typewriter letter-by-letter typing with cascading vertical positions, blinking cursors, phosphor glow, CRT scanlines, and explosive shatter scatter', filename: 'kinetic-typewriter-cascade.html', tags: ['kinetic', 'typography', 'typewriter', 'retro', 'crt'], category: 'captions' },
  { id: 'tpl-kinetic-matrix-rain',       title: 'Kinetic Matrix Rain',     description: 'Full Matrix digital rain with katakana characters where featured words materialize from the rain with scramble reveal and glow dissolve', filename: 'kinetic-matrix-rain.html', tags: ['kinetic', 'typography', 'matrix', 'hacker', 'rain'], category: 'captions' },
  { id: 'tpl-kinetic-liquid-fill',       title: 'Kinetic Liquid Fill',     description: 'Large hollow outline text fills with animated colored liquid wave rising from bottom, with bubbles, glossy shine, and drain animation', filename: 'kinetic-liquid-fill.html', tags: ['kinetic', 'typography', 'liquid', 'wave', 'fill'], category: 'captions' },
  { id: 'tpl-kinetic-neon-street',       title: 'Kinetic Neon Street',     description: 'Dark brick wall with neon-glowing words that flicker on like signs and buzz off with electric haze', filename: 'kinetic-neon-street.html', tags: ['kinetic', 'typography', 'neon', 'street', 'night'], category: 'captions' },
  { id: 'tpl-kinetic-vintage-punk',      title: 'Kinetic Vintage Punk',    description: 'Ransom-note cut-and-paste aesthetic with safety pins, X marks, and mixed cutout/inverted word styles', filename: 'kinetic-vintage-punk.html', tags: ['kinetic', 'typography', 'punk', 'ransom', 'vintage'], category: 'captions' },
  { id: 'tpl-kinetic-japanese-street',   title: 'Kinetic Japanese Street', description: 'Washi paper texture with brush-stroke word reveals, red hanko seals, and minimal Japanese-inspired layout', filename: 'kinetic-japanese-street.html', tags: ['kinetic', 'typography', 'japanese', 'brush', 'minimal'], category: 'captions' },
  { id: 'tpl-kinetic-concert-flyer',     title: 'Kinetic Concert Flyer',   description: 'Dark gig poster with words slamming down from above, halftone dots, star bursts, and shredding exit', filename: 'kinetic-concert-flyer.html', tags: ['kinetic', 'typography', 'concert', 'flyer', 'music'], category: 'captions' },
  { id: 'tpl-kinetic-propaganda',        title: 'Kinetic Propaganda',      description: 'Bold red background with radiating lines, yellow banner words marching in from sides with crumble exit', filename: 'kinetic-propaganda.html', tags: ['kinetic', 'typography', 'propaganda', 'bold', 'political'], category: 'captions' },
  { id: 'tpl-kinetic-torn-layers',       title: 'Kinetic Torn Layers',     description: 'Layered torn paper strips in white, colored, and kraft styles with tape pieces and peel-on/tear-off animations', filename: 'kinetic-torn-layers.html', tags: ['kinetic', 'typography', 'torn', 'paper', 'collage'], category: 'captions' },
  { id: 'tpl-kinetic-stencil-spray',     title: 'Kinetic Stencil Spray',   description: 'Concrete wall with spray-painted stencil words, paint splatters, drip effects, and blur-to-sharp reveal', filename: 'kinetic-stencil-spray.html', tags: ['kinetic', 'typography', 'stencil', 'graffiti', 'spray'], category: 'captions' },
  { id: 'tpl-kinetic-blackletter',       title: 'Kinetic Blackletter',     description: 'Dark gothic aesthetic with gold-etched words, ornamental borders, diamond corners, and smolder-out exit', filename: 'kinetic-blackletter.html', tags: ['kinetic', 'typography', 'gothic', 'blackletter', 'gold'], category: 'captions' },
  { id: 'tpl-kinetic-rave-fluo',         title: 'Kinetic Rave Fluo',       description: 'UV blacklight aesthetic with fluorescent glowing words, pulsing bass, strobe flicker exit, and sound wave bars', filename: 'kinetic-rave-fluo.html', tags: ['kinetic', 'typography', 'rave', 'fluorescent', 'uv'], category: 'captions' },
  { id: 'tpl-kinetic-minimal-paste',     title: 'Kinetic Minimal Paste-Up', description: 'Clean white grid background with sticky notes, circle marks, and words sliding in then lifting away with shadows', filename: 'kinetic-minimal-paste.html', tags: ['kinetic', 'typography', 'minimal', 'paste', 'clean'], category: 'captions' },
  { id: 'tpl-kinetic-fire-ember',        title: 'Kinetic Fire Ember',       description: 'Dark background with orange-red words burning in with brightness flash, floating ember particles, and burn-out exit', filename: 'kinetic-fire-ember.html', tags: ['kinetic', 'typography', 'fire', 'ember', 'hot'], category: 'captions' },
  { id: 'tpl-kinetic-ice-shatter',       title: 'Kinetic Ice Shatter',      description: 'Frozen blue words that crystallize in with blur, then shatter into flying ice shards on exit', filename: 'kinetic-ice-shatter.html', tags: ['kinetic', 'typography', 'ice', 'shatter', 'frozen'], category: 'captions' },
  { id: 'tpl-kinetic-comic-boom',        title: 'Kinetic Comic Boom',       description: 'Comic book action words with colored backgrounds, thick borders, speed lines, and oversized slam-in animation', filename: 'kinetic-comic-boom.html', tags: ['kinetic', 'typography', 'comic', 'pop', 'action'], category: 'captions' },
  { id: 'tpl-kinetic-chalk-board',       title: 'Kinetic Chalkboard',       description: 'Green chalkboard with handwritten-style words in colored chalk, dust particles, and erase-blur exit', filename: 'kinetic-chalk-board.html', tags: ['kinetic', 'typography', 'chalk', 'school', 'handwritten'], category: 'captions' },
  { id: 'tpl-kinetic-vaporwave',         title: 'Kinetic Vaporwave',        description: 'Purple-pink sunset gradient with fullwidth Japanese-style aesthetic text, chromatic aberration, and perspective grid floor', filename: 'kinetic-vaporwave.html', tags: ['kinetic', 'typography', 'vaporwave', 'aesthetic', 'retro'], category: 'captions' },
  { id: 'tpl-kinetic-gold-luxury',       title: 'Kinetic Gold Luxury',      description: 'Black background with italic serif words in animated gold gradient, sparkle particles, and letter-spacing reveal', filename: 'kinetic-gold-luxury.html', tags: ['kinetic', 'typography', 'gold', 'luxury', 'elegant'], category: 'captions' },
  { id: 'tpl-kinetic-retro-pixel',       title: 'Kinetic Retro Pixel',      description: '8-bit arcade style with neon pixel text on dark grid, stepped animations, and scattered pixel block particles', filename: 'kinetic-retro-pixel.html', tags: ['kinetic', 'typography', 'pixel', 'arcade', '8bit'], category: 'captions' },
  { id: 'tpl-kinetic-fog-drift',         title: 'Kinetic Fog Drift',        description: 'Minimal dark background with grey italic words materializing from fog blur, floating smoke wisps, and dissolve exit', filename: 'kinetic-fog-drift.html', tags: ['kinetic', 'typography', 'fog', 'smoke', 'ethereal'], category: 'captions' },
  { id: 'tpl-kinetic-electric-pulse',    title: 'Kinetic Electric Pulse',   description: 'Deep blue-black with electric cyan words that zap in with scaleX, pulsing glow, SVG lightning bolts, and vertical collapse exit', filename: 'kinetic-electric-pulse.html', tags: ['kinetic', 'typography', 'electric', 'lightning', 'energy'], category: 'captions' },
  { id: 'tpl-kinetic-blood-drip',        title: 'Kinetic Blood Drip',       description: 'Dark horror aesthetic with deep red words slashing in with skew, dripping blood trails, and melt-down exit', filename: 'kinetic-blood-drip.html', tags: ['kinetic', 'typography', 'horror', 'blood', 'dark'], category: 'captions' },
  { id: 'tpl-kinetic-watercolor-bleed',  title: 'Kinetic Watercolor Bleed', description: 'Warm paper texture with pastel watercolor words bleeding in from blur, paint blot splashes, and fade-spread exit', filename: 'kinetic-watercolor-bleed.html', tags: ['kinetic', 'typography', 'watercolor', 'pastel', 'art'], category: 'captions' },
  { id: 'tpl-kinetic-sci-fi-hud',        title: 'Kinetic Sci-Fi HUD',      description: 'Military scanner HUD with bracketed monospace words, horizontal scan-line clip reveal, pulse glow, and shrink-off exit', filename: 'kinetic-sci-fi-hud.html', tags: ['kinetic', 'typography', 'hud', 'scifi', 'military'], category: 'captions' },
  { id: 'tpl-kinetic-graffiti-tag',      title: 'Kinetic Graffiti Tag',     description: 'Concrete wall with vibrant spray-painted graffiti words, skew and rotation, paint splatter particles, and fade exit', filename: 'kinetic-graffiti-tag.html', tags: ['kinetic', 'typography', 'graffiti', 'street', 'spray'], category: 'captions' },
  { id: 'tpl-kinetic-woodblock-stamp',   title: 'Kinetic Woodblock Stamp',  description: 'Aged paper with bordered letterpress words stamping down with bounce, ink splatter marks, and fade-out exit', filename: 'kinetic-woodblock-stamp.html', tags: ['kinetic', 'typography', 'woodblock', 'stamp', 'press'], category: 'captions' },
  { id: 'tpl-kinetic-newspaper-headline', title: 'Kinetic Newspaper Headline', description: 'Cream newspaper with bold serif headlines slamming down from above, mixed italic/bold styles, and slide-left exit', filename: 'kinetic-newspaper-headline.html', tags: ['kinetic', 'typography', 'newspaper', 'headline', 'editorial'], category: 'captions' },
  { id: 'tpl-kinetic-hologram-flicker',  title: 'Kinetic Hologram Flicker', description: 'Dark background with translucent cyan hologram text that flickers in with scan-line effect, chromatic split, and shrink-off exit', filename: 'kinetic-hologram-flicker.html', tags: ['kinetic', 'typography', 'hologram', 'flicker', 'cyber'], category: 'captions' },
  { id: 'tpl-kinetic-sand-erosion',      title: 'Kinetic Sand Erosion',     description: 'Desert brown background with golden sand-colored words rising from below, wind-blown sand grain particles on exit', filename: 'kinetic-sand-erosion.html', tags: ['kinetic', 'typography', 'sand', 'desert', 'erosion'], category: 'captions' },
  { id: 'tpl-kinetic-neon-outline',      title: 'Kinetic Neon Outline',     description: 'Black background with transparent words outlined in bright neon stroke, breathing glow animation, and scale-up exit', filename: 'kinetic-neon-outline.html', tags: ['kinetic', 'typography', 'neon', 'outline', 'glow'], category: 'captions' },
  { id: 'tpl-kinetic-cyber-glitch',      title: 'Kinetic Cyber Glitch',     description: 'Hacker terminal with l33t-speak words, RGB split pseudo-elements, glitch shake animation, and skew-away exit', filename: 'kinetic-cyber-glitch.html', tags: ['kinetic', 'typography', 'cyber', 'glitch', 'hacker'], category: 'captions' },
  { id: 'tpl-kinetic-aurora-wave',       title: 'Kinetic Aurora Wave',      description: 'Deep night sky with aurora-colored light words, hue-shifting color animation, floating glow orbs, and drift-up exit', filename: 'kinetic-aurora-wave.html', tags: ['kinetic', 'typography', 'aurora', 'northern-lights', 'glow'], category: 'captions' },
  { id: 'tpl-kinetic-bounce-pop',       title: 'Kinetic Bounce Pop',       description: 'Playful bouncy words popping in with elastic spring physics and colorful pop effects', filename: 'kinetic-bounce-pop.html', tags: ['kinetic', 'typography', 'bounce', 'pop', 'playful'], category: 'captions' },
  { id: 'tpl-kinetic-electric-arc',     title: 'Kinetic Electric Arc',     description: 'High-voltage electric arcs between words with lightning bolts, sparks, and plasma glow', filename: 'kinetic-electric-arc.html', tags: ['kinetic', 'typography', 'electric', 'arc', 'lightning'], category: 'captions' },
  { id: 'tpl-kinetic-flip-board',       title: 'Kinetic Flip Board',       description: 'Airport departure board style with split-flap letter reveals and mechanical flip animations', filename: 'kinetic-flip-board.html', tags: ['kinetic', 'typography', 'flip', 'board', 'mechanical'], category: 'captions' },
  { id: 'tpl-kinetic-paper-cut',        title: 'Kinetic Paper Cut',        description: 'Layered paper cutout words with shadow depth, fold animations, and craft paper textures', filename: 'kinetic-paper-cut.html', tags: ['kinetic', 'typography', 'paper', 'cut', 'craft'], category: 'captions' },
  { id: 'tpl-kinetic-smoke-reveal',     title: 'Kinetic Smoke Reveal',     description: 'Words emerging from swirling smoke with wispy particle trails and atmospheric haze', filename: 'kinetic-smoke-reveal.html', tags: ['kinetic', 'typography', 'smoke', 'reveal', 'atmospheric'], category: 'captions' },
  { id: 'tpl-kinetic-spiral-vortex',    title: 'Kinetic Spiral Vortex',    description: 'Words spiraling into a vortex with rotational motion, depth blur, and centripetal animations', filename: 'kinetic-spiral-vortex.html', tags: ['kinetic', 'typography', 'spiral', 'vortex', 'rotation'], category: 'captions' },

  // ── Collages ──────────────────────────────────────────────────────────
  { id: 'tpl-collage-photo-grid',        title: 'Photo Grid Collage',        description: 'Animated grid of colored cells revealing in random order with Ken Burns zoom and gradient overlays', filename: 'collage-photo-grid.html', tags: ['collage', 'grid', 'photo', 'mosaic'], category: 'collages' },
  { id: 'tpl-collage-polaroid-scatter',  title: 'Polaroid Scatter Collage',  description: 'Scattered polaroid frames on cork board with push pins, captions, and drop-in/blow-away animations', filename: 'collage-polaroid-scatter.html', tags: ['collage', 'polaroid', 'vintage', 'scatter'], category: 'collages' },
  { id: 'tpl-collage-magazine-cutout',   title: 'Magazine Cutout Collage',   description: 'Mixed magazine clippings with headlines, ads, torn edges, circle stickers, and tape on aged paper', filename: 'collage-magazine-cutout.html', tags: ['collage', 'magazine', 'cutout', 'editorial'], category: 'collages' },
  { id: 'tpl-collage-film-strip',        title: 'Film Strip Collage',        description: 'Vertical 35mm film strips with sprocket holes, frame numbers, and slide-up/down reveal', filename: 'collage-film-strip.html', tags: ['collage', 'film', 'cinema', 'strip'], category: 'collages' },
  { id: 'tpl-collage-mood-board',        title: 'Mood Board Collage',        description: 'Design mood board with color palettes, fabric swatches, text cards, and washi tape accents', filename: 'collage-mood-board.html', tags: ['collage', 'mood', 'design', 'board'], category: 'collages' },
  { id: 'tpl-collage-scrapbook',         title: 'Scrapbook Collage',         description: 'Craft scrapbook with photos, emoji stickers, washi tape, ticket stubs, and handwritten notes', filename: 'collage-scrapbook.html', tags: ['collage', 'scrapbook', 'craft', 'memories'], category: 'collages' },
  { id: 'tpl-collage-geometric-mosaic',  title: 'Geometric Mosaic Collage',  description: 'Colorful tiles with triangle, circle, and diamond masks popping in via spiral order', filename: 'collage-geometric-mosaic.html', tags: ['collage', 'geometric', 'mosaic', 'abstract'], category: 'collages' },
  { id: 'tpl-collage-warhol-pop',        title: 'Warhol Pop Art Collage',    description: '3x3 pop art grid with abstract faces, halftone overlay, and color-flash saturated reveal', filename: 'collage-warhol-pop.html', tags: ['collage', 'pop-art', 'warhol', 'color'], category: 'collages' },
  { id: 'tpl-collage-brutalist',         title: 'Brutalist Collage',         description: 'Heavy black borders, outlined text, accent blocks with hard shadows, and snappy slide-in animations', filename: 'collage-brutalist.html', tags: ['collage', 'brutalist', 'bold', 'graphic'], category: 'collages' },
  { id: 'tpl-collage-retro-vhs',         title: 'Retro VHS Collage',         description: 'CRT scanlines, RGB fringe, tracking bars, glitch blocks, and VHS timestamps with static-in reveal', filename: 'collage-retro-vhs.html', tags: ['collage', 'vhs', 'retro', 'glitch'], category: 'collages' },
  { id: 'tpl-collage-newspaper-clip',    title: 'Newspaper Clippings',       description: 'Cut newspaper headlines and articles pinned in a 3-column grid with torn edges and drop-in animation', filename: 'collage-newspaper-clip.html', tags: ['collage', 'newspaper', 'clippings', 'editorial'], category: 'collages' },
  { id: 'tpl-collage-color-swatch',      title: 'Color Swatches',            description: 'Paint swatch cards with color codes and names in flexbox layout with flip-in reveal', filename: 'collage-color-swatch.html', tags: ['collage', 'color', 'swatch', 'design'], category: 'collages' },
  { id: 'tpl-collage-postcard-stack',    title: 'Postcard Stack',            description: 'Vintage postcards in a centered 3x2 grid with slight rotation and stamp-drop animation', filename: 'collage-postcard-stack.html', tags: ['collage', 'postcard', 'vintage', 'travel'], category: 'collages' },
  { id: 'tpl-collage-instant-camera',    title: 'Instant Camera',            description: 'Instant camera prints in 4x2 grid with white borders, captions, and shake-in animation', filename: 'collage-instant-camera.html', tags: ['collage', 'camera', 'instant', 'photo'], category: 'collages' },
  { id: 'tpl-collage-blueprint',         title: 'Blueprint Collage',         description: 'Technical blueprint drawings on blue grid paper with white line art and draw-in reveal', filename: 'collage-blueprint.html', tags: ['collage', 'blueprint', 'technical', 'architecture'], category: 'collages' },
  { id: 'tpl-collage-lookbook',          title: 'Lookbook Collage',          description: 'Fashion lookbook with CSS grid layout, season labels, gradient overlays, and fade reveal', filename: 'collage-lookbook.html', tags: ['collage', 'fashion', 'lookbook', 'editorial'], category: 'collages' },
  { id: 'tpl-collage-recipe-card',       title: 'Recipe Cards',              description: 'Food recipe cards with color images, prep times, servings, and 3D flip-in animation', filename: 'collage-recipe-card.html', tags: ['collage', 'recipe', 'food', 'cooking'], category: 'collages' },
  { id: 'tpl-collage-vinyl-crate',       title: 'Vinyl Crate',              description: 'Record album covers with artist names and labels in warm dark theme with slide-in animation', filename: 'collage-vinyl-crate.html', tags: ['collage', 'vinyl', 'music', 'records'], category: 'collages' },
  { id: 'tpl-collage-gallery-wall',      title: 'Gallery Wall',             description: 'Framed artworks in CSS grid with mat borders, labels, and hang-in/unhang animation', filename: 'collage-gallery-wall.html', tags: ['collage', 'gallery', 'frames', 'art'], category: 'collages' },
  { id: 'tpl-collage-sticky-notes',      title: 'Sticky Notes',             description: 'Colorful sticky notes in 4x3 grid with checklists, slight rotations, and drop-in peel-off animation', filename: 'collage-sticky-notes.html', tags: ['collage', 'sticky', 'notes', 'todo'], category: 'collages' },
  { id: 'tpl-collage-travel-stamps',     title: 'Travel Stamps',            description: 'Passport-style travel stamps with city icons, dates, dashed borders, and stamp-down animation', filename: 'collage-travel-stamps.html', tags: ['collage', 'travel', 'stamps', 'passport'], category: 'collages' },
  { id: 'tpl-collage-app-screens',       title: 'App Screens',              description: 'Mobile app mockups with phone frames, gradient screens, UI elements, and slide-up animation', filename: 'collage-app-screens.html', tags: ['collage', 'app', 'mobile', 'ui'], category: 'collages' },
  { id: 'tpl-collage-trading-cards',     title: 'Trading Cards',            description: 'Fantasy trading cards with rarity badges, ATK/DEF stats, glow effects, and deal-in animation', filename: 'collage-trading-cards.html', tags: ['collage', 'cards', 'trading', 'gaming'], category: 'collages' },
  { id: 'tpl-collage-book-shelf',        title: 'Book Shelf',               description: 'Library book spines on wooden shelves with vertical titles, varied heights, and slide-up animation', filename: 'collage-book-shelf.html', tags: ['collage', 'books', 'shelf', 'library'], category: 'collages' },
  { id: 'tpl-collage-dashboard-widgets', title: 'Dashboard Widgets',        description: 'Data dashboard with metric cards, bar charts, badges, and wide panels in dark theme with pop-in animation', filename: 'collage-dashboard-widgets.html', tags: ['collage', 'dashboard', 'data', 'widgets'], category: 'collages' },
  { id: 'tpl-collage-team-roster',       title: 'Team Roster',              description: 'Team member cards with avatar initials, roles, status indicators, and skill tags with slide-up animation', filename: 'collage-team-roster.html', tags: ['collage', 'team', 'roster', 'people'], category: 'collages' },
  { id: 'tpl-collage-movie-posters',     title: 'Movie Posters',            description: 'Film posters with genre badges, star ratings, director credits, and scale-reveal animation on dark background', filename: 'collage-movie-posters.html', tags: ['collage', 'movie', 'poster', 'cinema'], category: 'collages' },
  { id: 'tpl-collage-product-showcase',  title: 'Product Showcase',         description: 'E-commerce product cards with prices, star ratings, tags, and slide-up animation on light background', filename: 'collage-product-showcase.html', tags: ['collage', 'product', 'ecommerce', 'shop'], category: 'collages' },
  { id: 'tpl-collage-event-tickets',     title: 'Event Tickets',            description: 'Ticket stubs with perforated edges, event details, dates, and slide-in animation on dark background', filename: 'collage-event-tickets.html', tags: ['collage', 'tickets', 'events', 'entertainment'], category: 'collages' },
  { id: 'tpl-collage-social-cards',      title: 'Social Media Cards',       description: 'Social post cards with avatars, engagement stats, preview images, and pop-in animation', filename: 'collage-social-cards.html', tags: ['collage', 'social', 'cards', 'feed'], category: 'collages' },

  // ── New Animation Templates ──────────────────────────────────────────
  { id: 'tpl-podcast-waveform',    title: 'Podcast Waveform',    description: 'Audio waveform visualizer with speaker names, episode info, and animated frequency bars', filename: 'podcast-waveform.html', tags: ['podcast', 'audio', 'waveform', 'music'] },
  { id: 'tpl-crypto-dashboard',    title: 'Crypto Dashboard',    description: 'Live cryptocurrency dashboard with animated price charts, ticker symbols, and market data', filename: 'crypto-dashboard.html', tags: ['crypto', 'dashboard', 'finance', 'charts'] },
  { id: 'tpl-space-launch',        title: 'Space Launch',        description: 'Rocket launch countdown with starfield background, smoke particles, and mission stats', filename: 'space-launch.html', tags: ['space', 'rocket', 'countdown', 'launch'] },
  { id: 'tpl-recipe-cooking',      title: 'Recipe Cooking',      description: 'Animated recipe card with ingredient list, step-by-step instructions, and cooking timer', filename: 'recipe-cooking.html', tags: ['recipe', 'cooking', 'food', 'kitchen'] },
  { id: 'tpl-music-player',        title: 'Music Player',        description: 'Retro music player with vinyl record spin, track info, progress bar, and equalizer bars', filename: 'music-player.html', tags: ['music', 'player', 'vinyl', 'audio'] },
  { id: 'tpl-neon-city',           title: 'Neon City',           description: 'Cyberpunk neon cityscape with glowing buildings, rain effect, and flickering signs', filename: 'neon-city.html', tags: ['neon', 'city', 'cyberpunk', 'night'] },
  { id: 'tpl-comparison-table',    title: 'Comparison Table',    description: 'Animated comparison table with feature rows, check/cross marks, and highlight columns', filename: 'comparison-table.html', tags: ['comparison', 'table', 'features', 'pricing'] },
  { id: 'tpl-particle-text',       title: 'Particle Text',       description: 'Words formed from particles that assemble, hold, then explode before cycling to next word', filename: 'particle-text.html', tags: ['particle', 'text', 'animation', 'kinetic'] },
  { id: 'tpl-notification-stack',  title: 'Notification Stack',  description: 'Stack of notification cards sliding in with icons, timestamps, and dismiss animations', filename: 'notification-stack.html', tags: ['notification', 'stack', 'ui', 'alerts'] },
  { id: 'tpl-film-credits',        title: 'Film Credits',        description: 'Movie end credits with scrolling names, roles, and cinematic formatting on dark background', filename: 'film-credits.html', tags: ['film', 'credits', 'movie', 'scroll'] },
  { id: 'tpl-underwater-ocean',    title: 'Underwater Ocean',    description: 'Deep ocean scene with floating bubbles, light rays, swimming fish, and swaying seaweed', filename: 'underwater-ocean.html', tags: ['underwater', 'ocean', 'nature', 'fish'] },
  { id: 'tpl-ai-neural-network',   title: 'AI Neural Network',   description: 'Animated neural network with pulsing nodes, data flow connections, and layer visualization', filename: 'ai-neural-network.html', tags: ['ai', 'neural', 'network', 'tech'] },
  { id: 'tpl-social-stats',        title: 'Social Stats',        description: 'Social media analytics dashboard with follower counts, engagement rates, and animated graphs', filename: 'social-stats.html', tags: ['social', 'stats', 'analytics', 'dashboard'] },
  { id: 'tpl-matrix-code',         title: 'Matrix Code Rain',    description: 'Matrix-style falling code rain with green characters on black background', filename: 'matrix-code.html', tags: ['matrix', 'code', 'hacker', 'digital'] },
  { id: 'tpl-typing-chat',         title: 'Typing Chat',         description: 'Chat conversation with typing indicators, message bubbles, and sequential reveal', filename: 'typing-chat.html', tags: ['chat', 'typing', 'conversation', 'messaging'] },
  { id: 'tpl-radar-scan',          title: 'Radar Scan',          description: 'Military-style radar display with rotating sweep, blip targets, and range rings', filename: 'radar-scan.html', tags: ['radar', 'scan', 'military', 'tech'] },
  { id: 'tpl-progress-loader',     title: 'Progress Loader',     description: 'Creative loading animations with multiple stages, progress percentage, and status messages', filename: 'progress-loader.html', tags: ['progress', 'loader', 'loading', 'ui'] },
  { id: 'tpl-mindmap-tree',        title: 'Mind Map Tree',       description: 'Animated mind map with branching nodes, connecting lines, and expanding hierarchy', filename: 'mindmap-tree.html', tags: ['mindmap', 'tree', 'diagram', 'brainstorm'] },
  { id: 'tpl-retro-tv-static',     title: 'Retro TV Static',     description: 'Old CRT television with static noise, channel switching, and vintage scan lines', filename: 'retro-tv-static.html', tags: ['retro', 'tv', 'static', 'vintage'] },
  { id: 'tpl-data-globe',          title: 'Data Globe',          description: 'Rotating wireframe globe with data points, connection arcs, and orbiting satellites', filename: 'data-globe.html', tags: ['globe', 'data', 'world', '3d'] },
  { id: 'tpl-maptiler-map', title: 'MapTiler Map', description: 'Interactive MapTiler map with satellite/streets/terrain styles. Supports frame-synced commands: flyTo (smooth camera flights), addMarker, drawRoute (animated paths), set3DTerrain, setStyle. Ideal for travel, location, route, and geographic storytelling. Commands: flyTo, addMarker, clearMarkers, drawRoute, clearRoutes, setStyle, set3DTerrain, setPitch, setBearing, addPopup, fitBounds, hideUI, showUI.', filename: 'maptiler-map.html', tags: ['map', 'maptiler', 'satellite', 'terrain', 'geography', 'travel', 'route', 'location', 'street', '3d-terrain', 'flyover'] },
  { id: 'tpl-maptiler-globe', title: 'MapTiler Globe', description: 'Rotating 3D globe with MapTiler satellite imagery. Supports frame-synced commands: flyTo, addMarker, drawRoute, setStyle. Perfect for global perspectives, international topics, and space-to-ground zoom animations.', filename: 'maptiler-globe.html', tags: ['globe', 'maptiler', 'satellite', '3d', 'earth', 'world', 'space', 'international', 'global'] },

  // ── Faceless Video Templates ──────────────────────────────────────────
  { id: 'tpl-faceless-listicle', title: 'Faceless Listicle', description: 'Numbered list items revealing one-by-one with slide-up animation. Ideal for "Top 5" and "X Things You Didn\'t Know" faceless content. CONFIG: title, items, accentColor.', filename: 'faceless-listicle.html', tags: ['faceless', 'listicle', 'list', 'top5', 'educational', 'voiceover'] },
  { id: 'tpl-faceless-fact-reveal', title: 'Faceless Fact Reveal', description: 'Big bold text reveal with zoom-punch animation for shocking facts and statistics. CONFIG: facts (array), bgColor, textColor, accentColor.', filename: 'faceless-fact-reveal.html', tags: ['faceless', 'facts', 'statistics', 'reveal', 'educational', 'voiceover'] },
  { id: 'tpl-faceless-kinetic-type', title: 'Faceless Kinetic Typography', description: 'Word-by-word kinetic typography synced to voiceover. Text animates with scale, rotation, and color emphasis. CONFIG: words, primaryColor, secondaryColor, bgColor.', filename: 'faceless-kinetic-type.html', tags: ['faceless', 'kinetic', 'typography', 'text', 'voiceover', 'motion'] },
  { id: 'tpl-faceless-split-compare', title: 'Faceless Split Compare', description: 'Split-screen comparison with VS divider. Shows two options/items side by side. CONFIG: leftLabel, rightLabel, leftStats, rightStats, vsText.', filename: 'faceless-split-compare.html', tags: ['faceless', 'compare', 'versus', 'split', 'voiceover'] },
  { id: 'tpl-faceless-countdown', title: 'Faceless Countdown', description: 'Countdown timer with dramatic number reveals. Numbers flip/morph with particle effects. CONFIG: startNumber, title, items (number+text).', filename: 'faceless-countdown.html', tags: ['faceless', 'countdown', 'ranking', 'numbers', 'voiceover'] },

  // ── Meme Templates ───────────────────────────────────────────────────
  ...MEME_TEMPLATES,
]

// Populate the set of built-in IDs at module scope so the marketplace
// persist layer can strip their htmlContent before any store writes.
for (const tpl of BUILTIN_TEMPLATES) {
  builtinTemplateIds.add(tpl.id)
}

// ── Vite raw imports for all templates ────────────────────────────────
const templateModules = import.meta.glob('./templates/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function getTemplateContent(filename: string): string | null {
  const key = `./templates/${filename}`
  return templateModules[key] ?? null
}

/**
 * Seed the marketplace store with built-in templates.
 * Uses a single batched setState to avoid 200+ individual persist writes.
 * Built-in templates do NOT store htmlContent in the store — it is resolved
 * on-demand via getTemplateContent() to keep memory and localStorage low.
 */
export function seedBuiltinTemplates(): void {
  const store = useMarketplaceStore.getState()
  const existingById = new Map(store.items.map((i) => [i.id, i]))

  const expectedCategories = new Map(
    BUILTIN_TEMPLATES.map((tpl) => [tpl.id, tpl.category || 'html-templates'])
  )
  const builtinByFilename = new Map(
    BUILTIN_TEMPLATES.map((tpl) => [tpl.id, tpl.filename])
  )

  // Collect new items without htmlContent
  const deletedIds = new Set(store.deletedBuiltinIds ?? [])
  const newItems: import('@/stores/useMarketplaceStore').MarketplaceItem[] = []
  for (const tpl of BUILTIN_TEMPLATES) {
    if (deletedIds.has(tpl.id)) continue
    if (existingById.has(tpl.id)) continue
    if (!getTemplateContent(tpl.filename)) {
      console.warn(`[seedBuiltinTemplates] Template file not found: ${tpl.filename}`)
      continue
    }
    newItems.push({
      id: tpl.id,
      title: tpl.title,
      description: tpl.description,
      category: (tpl.category || 'html-templates') as MarketplaceCategory,
      published: false,
      createdAt: Date.now() - (BUILTIN_TEMPLATES.length - newItems.length) * 1000,
    })
  }

  // Single batched setState
  let fixed = 0
  useMarketplaceStore.setState((s) => {
    let items = s.items

    // Fix categories + strip stale htmlContent from built-in items
    items = items.map((item) => {
      const expectedCat = expectedCategories.get(item.id)
      const isBuiltin = builtinByFilename.has(item.id)
      const needsCategoryFix = expectedCat && item.category !== expectedCat
      const needsHtmlStrip = isBuiltin && item.htmlContent

      if (!needsCategoryFix && !needsHtmlStrip) return item
      if (needsCategoryFix) fixed++
      return {
        ...item,
        ...(needsCategoryFix ? { category: expectedCat as MarketplaceCategory } : {}),
        ...(needsHtmlStrip ? { htmlContent: undefined } : {}),
      }
    })

    if (newItems.length > 0) {
      items = [...newItems, ...items]
    }

    return { items }
  })

  if (fixed > 0) console.log(`[seedBuiltinTemplates] Fixed categories for ${fixed} templates`)
  if (newItems.length > 0) console.log(`[seedBuiltinTemplates] Added ${newItems.length} built-in templates`)
}
