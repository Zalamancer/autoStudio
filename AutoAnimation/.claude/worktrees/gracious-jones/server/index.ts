import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import https from 'node:https'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import * as Sentry from '@sentry/node'

// Prevent unhandled promise rejections (e.g. from @gradio/client) from crashing the server
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled promise rejection (server kept alive):', reason)
  Sentry.captureException(reason)
})

// Explicitly load .env from server/ directory (not project root)
const __serverDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__serverDir, '.env'), override: true })

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  })
}

// If GOOGLE_APPLICATION_CREDENTIALS_JSON is set (Railway), write it to a temp file
// so the Google Auth library can find it via GOOGLE_APPLICATION_CREDENTIALS
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    const tmpKeyPath = path.join(os.tmpdir(), 'gcp-sa-key.json')
    fs.writeFileSync(tmpKeyPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpKeyPath
    console.log(`✅ GCP credentials written to ${tmpKeyPath}`)
  } catch (e) {
    console.error('⚠️  Failed to write GCP credentials file:', e)
  }
}

import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai'
import aiAnimationRoutes from './routes/aiAnimation'
import meshyRoutes from './routes/meshy'
import hunyuanMotionRoutes from './routes/hunyuanMotion'
import autoRigRoutes from './routes/autoRig'
import socialRoutes from './routes/social'
import learningRoutes from './routes/learning'
import stripeRoutes, { stripeWebhookHandler } from './routes/stripe'
import creditRoutes from './routes/credits'
import marketplaceRoutes from './routes/marketplace'
import bgRemovalRoutes, { isRembgConfigured, startRembgServer } from './routes/bgRemoval'
import brandDirectorRoutes from './routes/brandDirector'
import competitorScraperRoutes from './routes/competitorScraper'
import urlToVideoRoutes from './routes/urlToVideo'
import contentExtractorRoutes from './routes/contentExtractor'
import viralityAnalysisRoutes from './routes/viralityAnalysis'
import proxyRoutes from './routes/proxy'
import recraftRoutes, { isRecraftConfigured } from './routes/recraft'
import generatorRoutes from './routes/generator'
import imageToVideoRoutes from './routes/imageToVideo'
import musicGenerationRoutes from './routes/musicGeneration'
import autoPublishRoutes from './routes/autoPublish'
import styleTransferRoutes from './routes/styleTransfer'
import whisperRoutes from './routes/whisper'
import nanoBanana2Routes from './routes/nanoBanana2'
import svgAnimationRoutes from './routes/svgAnimation'
import manimRoutes from './routes/manim'
import pixelLabRoutes from './routes/pixelLab'
import deepmotionRoutes from './routes/deepmotion'
import recordingsRoutes from './routes/recordings'
import charactersRoutes from './routes/characters'
import pixelArtCharactersRoutes from './routes/pixelArtCharacters'
import characters3dRoutes from './routes/characters3d'
import avatarCharactersRoutes from './routes/avatarCharacters'
import notificationsRoutes from './routes/notifications'
import portfolioRoutes from './routes/portfolio'
import aiProviderRoutes from './routes/aiProvider'
import { requireApiKey } from './middleware/apiKeyAuth'
import { usageLogger } from './middleware/usageLogger'
import v1RendersRoutes from './routes/v1/renders'
import v1ApiKeysRoutes from './routes/v1/apiKeys'
import v1WebhooksRoutes from './routes/v1/webhooks'
import v1VoicesRoutes from './routes/v1/voices'
import v1CharactersRoutes from './routes/v1/characters'
import v1TemplatesRoutes from './routes/v1/templates'
import v1ProjectsRoutes from './routes/v1/projects'
import v1TranslateRoutes from './routes/v1/translate'
import { isClaudeConfigured } from './services/claude'
import { requireAuth, isSocialConfigured } from './middleware/supabaseAuth'
import { isStripeConfigured } from './services/stripeService'
import { isFFmpegAvailable } from './services/encoder'
import { startScheduler, stopScheduler } from './jobs/scheduler'
import { startMetricsPoller, stopMetricsPoller } from './jobs/metricsPoller'
import devTemplatesRoutes from './routes/devTemplates'
import templateRatingsRoutes from './routes/templateRatings'
import templateGenerationRoutes from './routes/templateGeneration'
import rewardModelRoutes from './routes/rewardModel'

const app = express()
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000']

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no Origin header (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}))

// Stripe webhook needs raw body for signature verification — mount BEFORE express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler)

// DeepMotion needs raw video buffer — mount BEFORE express.json()
app.use('/api/deepmotion/process', express.raw({ type: 'video/*', limit: '100mb' }))

app.use(express.json({ limit: '100mb' })) // Large for base64 images + audio

// Rate limiting for expensive AI endpoints (20 requests per minute per IP)
// Credit system handles abuse prevention; this is a safety net against runaway loops
// Skip preflight OPTIONS requests so CORS works correctly
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many AI requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
})

app.use('/api/ai-animation', aiRateLimiter)
app.use('/api/generate-full-sheet', aiRateLimiter)
app.use('/api/generate-emotion-heads', aiRateLimiter)
// AI Animation routes (Claude-powered SVG animation pipeline)
app.use('/api/ai-animation', requireAuth, aiAnimationRoutes)

// Stripe billing + credit routes
app.use('/api/stripe', stripeRoutes)
app.use('/api/credits', creditRoutes)
app.use('/api/marketplace', marketplaceRoutes)

// Social media OAuth + publishing routes
app.use('/api/social', socialRoutes)

// AI Content Performance Learning routes
app.use('/api/learning', learningRoutes)
app.use('/api/learning/analyze-gemini', aiRateLimiter)

// 3D Character routes
app.use('/api/meshy', requireAuth, aiRateLimiter, meshyRoutes)
app.use('/api/motion', requireAuth, aiRateLimiter, hunyuanMotionRoutes)
app.use('/api/auto-rig', requireAuth, aiRateLimiter, autoRigRoutes)
app.use('/api/bg-remove', requireAuth, bgRemovalRoutes)
app.use('/api/brand-director', requireAuth, aiRateLimiter, brandDirectorRoutes)
app.use('/api/competitor-scraper', requireAuth, aiRateLimiter, competitorScraperRoutes)
app.use('/api/url-to-video', requireAuth, aiRateLimiter, urlToVideoRoutes)
app.use('/api/content-extractor', requireAuth, contentExtractorRoutes)
app.use('/api/virality', requireAuth, aiRateLimiter, viralityAnalysisRoutes)
app.use('/api/proxy', requireAuth, proxyRoutes)
// Recraft status check is public (no auth needed — frontend checks availability before login)
app.get('/api/recraft/status', (_req, res) => {
  res.json({ configured: isRecraftConfigured() })
})
app.use('/api/recraft', requireAuth, aiRateLimiter, recraftRoutes)
app.use('/api/generator', requireAuth, aiRateLimiter, generatorRoutes)
app.use('/api/image-to-video', requireAuth, aiRateLimiter, imageToVideoRoutes)
app.use('/api/music-generation', requireAuth, aiRateLimiter, musicGenerationRoutes)
app.use('/api/auto-publish', requireAuth, autoPublishRoutes)
app.use('/api/style-transfer', requireAuth, aiRateLimiter, styleTransferRoutes)
app.use('/api/whisper', requireAuth, aiRateLimiter, whisperRoutes)
app.use('/api/svg-animation', requireAuth, aiRateLimiter, svgAnimationRoutes)
app.use('/api/manim', requireAuth, aiRateLimiter, manimRoutes)
app.use('/api/pixellab', requireAuth, aiRateLimiter, pixelLabRoutes)
app.use('/api/deepmotion', requireAuth, aiRateLimiter, deepmotionRoutes)
app.use('/api/ai', requireAuth, aiRateLimiter, aiProviderRoutes)
app.use('/api/recordings', requireAuth, recordingsRoutes)
app.use('/api/characters', requireAuth, charactersRoutes)
app.use('/api/pixelart-characters', requireAuth, pixelArtCharactersRoutes)
app.use('/api/3d-characters', requireAuth, characters3dRoutes)
app.use('/api/avatar-characters', requireAuth, avatarCharactersRoutes)
app.use('/api/notifications', notificationsRoutes)

// Portfolio platform routes
app.use('/api/portfolio', portfolioRoutes)

// Dev-only template management (no auth — only active in dev)
app.use('/api/dev/templates', devTemplatesRoutes)
app.use('/api/template-ratings', templateRatingsRoutes)
app.use('/api/generate-templates', templateGenerationRoutes)
app.use('/api/reward-model', rewardModelRoutes)

// Nano Banana 2 character generator (8 sequential calls per pipeline — use separate rate limiter)
const nb2RateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many NB2 requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
})
app.use('/api/nb2', requireAuth, nb2RateLimiter, nanoBanana2Routes)

// ── API v1 (Public REST API) ─────────────────────────────────────────────────
// API-key-authenticated routes with usage logging
app.use('/api/v1/renders', requireApiKey, usageLogger, aiRateLimiter, v1RendersRoutes)
app.use('/api/v1/voices', requireApiKey, usageLogger, v1VoicesRoutes)
app.use('/api/v1/characters', requireApiKey, usageLogger, v1CharactersRoutes)
app.use('/api/v1/templates', requireApiKey, usageLogger, v1TemplatesRoutes)
app.use('/api/v1/projects', requireApiKey, usageLogger, v1ProjectsRoutes)
app.use('/api/v1/translate', requireApiKey, usageLogger, aiRateLimiter, v1TranslateRoutes)
app.use('/api/v1/webhooks', requireApiKey, usageLogger, v1WebhooksRoutes)
// API key management uses JWT auth (dashboard only)
app.use('/api/v1/api-keys', v1ApiKeysRoutes)

// ── Mobile API (JWT-authenticated, same v1 routes) ──────────────────────────
app.use('/api/mobile/templates', requireAuth, v1TemplatesRoutes)
app.use('/api/mobile/projects', requireAuth, v1ProjectsRoutes)
app.use('/api/mobile/renders', requireAuth, aiRateLimiter, v1RendersRoutes)

// Serve OpenAPI spec as static YAML
app.get('/api/v1/openapi.yaml', (_req, res) => {
  const specPath = path.join(__serverDir, 'openapi.yaml')
  if (fs.existsSync(specPath)) {
    res.setHeader('Content-Type', 'text/yaml')
    res.sendFile(specPath)
  } else {
    res.status(404).json({ error: 'OpenAPI spec not found' })
  }
})

// Swagger UI (CDN-based)
app.get('/api/docs', (_req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ProAnimate API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>SwaggerUIBundle({ url: '/api/v1/openapi.yaml', dom_id: '#swagger-ui' })</script>
</body>
</html>`)
})

// Initialize Vertex AI (lazy — only crashes if an endpoint actually needs it)
const projectId = process.env.GCP_PROJECT_ID
const location = process.env.GCP_LOCATION || 'us-central1'

let _vertexAI: VertexAI | null = null
function getVertexAI(): VertexAI {
  if (!_vertexAI) {
    if (!projectId) {
      throw new Error('GCP_PROJECT_ID environment variable is required for Vertex AI endpoints')
    }
    _vertexAI = new VertexAI({ project: projectId, location })
  }
  return _vertexAI
}

if (!projectId) {
  console.warn('⚠️  GCP_PROJECT_ID not set — Vertex AI endpoints (sprite sheet, emotion heads) will be unavailable')
}

// Image generation model - use the one with image output support
const IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation'

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', projectId, location, imageModel: IMAGE_MODEL, claudeConfigured: isClaudeConfigured(), socialConfigured: isSocialConfigured(), stripeConfigured: isStripeConfigured(), rembgAvailable: isRembgConfigured() })
})

// Proxy endpoint for downloading external audio (e.g. Freesound previews blocked by CORS)
app.get('/api/proxy/audio', async (req, res) => {
  const url = req.query.url as string
  if (!url) { res.status(400).json({ error: 'Missing url parameter' }); return }

  // Only allow freesound.org domains for security
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith('freesound.org')) {
      res.status(403).json({ error: 'Only freesound.org URLs are allowed' }); return
    }
  } catch {
    res.status(400).json({ error: 'Invalid URL' }); return
  }

  try {
    const upstream = await fetch(url)
    if (!upstream.ok) { res.status(upstream.status).json({ error: `Upstream: ${upstream.statusText}` }); return }

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg'
    res.set('Content-Type', contentType)
    const buffer = await upstream.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    console.error('[proxy/audio] Error:', err)
    res.status(500).json({ error: 'Failed to proxy audio' })
  }
})

// Generate a complete 12-viseme sprite sheet
// Layout: 12 columns × 1 row (one per viseme)
app.post('/api/generate-full-sheet', async (req, res) => {
  try {
    const { referenceImage, stylePrompt } = req.body

    if (!referenceImage) {
      return res.status(400).json({
        error: 'Missing required field: referenceImage'
      })
    }

    console.log('Generating 12-viseme sprite sheet (12x1 grid)...')
    if (stylePrompt) console.log(`Style prompt: ${stylePrompt}`)

    const visemeDescriptions: Record<string, string> = {
      Aa: 'wide open mouth (AH/EYE)',
      D: 'tongue behind upper teeth (D/T/N)',
      Ee: 'wide smile showing teeth (EE)',
      F: 'lower lip under teeth (F/V)',
      L: 'tongue tip up behind teeth (L/TH)',
      M: 'lips pressed together (M/B/P)',
      O: 'rounded open mouth (OH)',
      R: 'slightly open, tongue pulled back (R/ER)',
      S: 'teeth together, lips slightly parted (S/Z)',
      U: 'pursed lips (OO/W)',
      W: 'rounded pursed lips (W)',
      Rest: 'closed, relaxed mouth',
    }

    const visemes = ['Aa', 'D', 'Ee', 'F', 'L', 'M', 'O', 'R', 'S', 'U', 'W', 'Rest']
    const visemeList = visemes.map((v, i) => `${i + 1}. ${v}: ${visemeDescriptions[v]}`).join(', ')

    const styleInstruction = stylePrompt ? `\nStyle: ${stylePrompt}` : ''

    const prompt = `Based on this reference character image, generate a sprite sheet showing the character's mouth/lips in different positions.

Create a 12-column × 1-row grid (12 cells total) showing ONLY the mouth area:

${visemeList}

Requirements:
- Keep the EXACT same art style, colors, and character design as the reference
- Show ONLY the mouth/lower face area for each cell
- Each cell must be the same size
- Clean grid layout with visible separation between cells
- White or transparent background
- Maintain consistent lighting and style across all 12 cells${styleInstruction}`

    const model = getVertexAI().getGenerativeModel({
      model: IMAGE_MODEL,
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseModalities: ['TEXT', 'IMAGE'] as any,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    })

    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: referenceImage.replace(/^data:image\/\w+;base64,/, '')
            }
          },
          { text: prompt }
        ]
      }],
    })

    const result = response.response
    console.log('Response received')

    const candidate = result.candidates?.[0]

    if (!candidate?.content?.parts) {
      console.error('No content in response')
      return res.status(500).json({ error: 'No content generated' })
    }

    // Find image part
    const imagePart = candidate.content.parts.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    )

    if (imagePart?.inlineData?.data) {
      console.log('Full sprite sheet generated successfully')
      return res.json({
        image: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
        gridSize: { columns: 12, rows: 1 },
        visemeOrder: visemes,
      })
    }

    // Check for text response
    const textPart = candidate.content.parts.find((part: any) => part.text)
    if (textPart?.text) {
      console.log('Got text instead of image:', textPart.text.substring(0, 500))
      return res.status(500).json({
        error: 'Model returned text instead of image',
        message: textPart.text.substring(0, 500)
      })
    }

    return res.status(500).json({ error: 'No image generated' })

  } catch (error) {
    console.error('Full sheet generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      error: 'Generation failed',
      message: errorMessage
    })
  }
})

// Generate a 6×4 emotion head sprite sheet (6 emotions × 4 intensities = 24 heads)
// Row order: Joy, Anger, Disgust, Fear, Sadness, Surprise
// Column order: level 1 (mild), 2 (moderate), 3 (strong), 4 (extreme)
app.post('/api/generate-emotion-heads', async (req, res) => {
  try {
    const { referenceImage, stylePrompt } = req.body

    if (!referenceImage) {
      return res.status(400).json({
        error: 'Missing required field: referenceImage'
      })
    }

    console.log('Generating 6×4 emotion head sprite sheet (24 variants)...')
    if (stylePrompt) console.log(`Style prompt: ${stylePrompt}`)

    const emotionDescriptions: Record<string, { name: string; intensities: string[] }> = {
      Joy: {
        name: 'Joy',
        intensities: [
          'Satisfaction - subtle, content smile, relaxed eyes',
          'Amusement - moderate smile, slightly raised cheeks',
          'Joy - broad smile, bright eyes, raised eyebrows',
          'Laughter - wide open mouth laugh, squinted eyes, raised cheeks',
        ],
      },
      Anger: {
        name: 'Anger',
        intensities: [
          'Sternness - slightly furrowed brows, firm expression',
          'Indignation - furrowed brows, tightened jaw, narrowed eyes',
          'Anger - deeply furrowed brows, flared nostrils, intense stare',
          'Rage - extreme brow furrow, bared teeth, wide fierce eyes',
        ],
      },
      Disgust: {
        name: 'Disgust',
        intensities: [
          'Disdain - slight nose wrinkle, one raised eyebrow',
          'Aversion - wrinkled nose, pulled back upper lip',
          'Disgust - deeply wrinkled nose, exposed teeth, squinted eyes',
          'Revulsion - extreme nose wrinkle, tongue out, eyes nearly closed',
        ],
      },
      Fear: {
        name: 'Fear',
        intensities: [
          'Concern - slightly raised eyebrows, tense forehead',
          'Anxiety - raised eyebrows, wide eyes, tense mouth',
          'Fear - very wide eyes, raised eyebrows, open mouth',
          'Terror - extremely wide eyes, mouth agape, pale face, pulled back',
        ],
      },
      Sadness: {
        name: 'Sadness',
        intensities: [
          'Dejection - slightly downturned mouth, droopy eyes',
          'Melancholy - downturned mouth, half-closed eyes, slight frown',
          'Sadness - deeply downturned mouth, watery eyes, furrowed inner brows',
          'Grief - crying, tears streaming, scrunched face, deeply pained',
        ],
      },
      Surprise: {
        name: 'Surprise',
        intensities: [
          'Alertness - slightly raised eyebrows, attentive eyes',
          'Wonder - raised eyebrows, wide curious eyes, slightly open mouth',
          'Surprise - very raised eyebrows, wide open eyes, open mouth',
          'Shock - extremely wide eyes, dropped jaw, raised forehead',
        ],
      },
    }

    const emotionOrder = ['Joy', 'Anger', 'Disgust', 'Fear', 'Sadness', 'Surprise']

    const rowDescriptions = emotionOrder.map((emotion, rowIdx) => {
      const desc = emotionDescriptions[emotion]
      const cols = desc.intensities.map((intensity, colIdx) => `  Column ${colIdx + 1}: ${intensity}`).join('\n')
      return `ROW ${rowIdx + 1} - ${emotion.toUpperCase()}:\n${cols}`
    }).join('\n\n')

    const styleInstruction = stylePrompt ? `\nStyle: ${stylePrompt}` : ''

    const prompt = `Based on this reference character image, generate a sprite sheet showing the character's HEAD/FACE with different emotions and intensities.

Create a 4-column × 6-row grid (24 cells total) showing the character's HEAD with different emotional expressions:

${rowDescriptions}

Requirements:
- Keep the EXACT same art style, colors, and character design as the reference
- Show the FULL HEAD (face, hair, features) for each cell - not just the mouth
- Each cell must be the same size
- Clean grid layout with visible separation between cells
- White or transparent background
- Each row represents a different emotion category
- Each column represents increasing intensity (1=mild, 2=moderate, 3=strong, 4=extreme)
- The facial expression should clearly change between intensity levels
- Maintain consistent head size, angle, and style across all 24 cells
- Focus on the eyes, eyebrows, mouth shape, and overall facial tension to convey each emotion${styleInstruction}`

    const model = getVertexAI().getGenerativeModel({
      model: IMAGE_MODEL,
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseModalities: ['TEXT', 'IMAGE'] as any,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    })

    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: referenceImage.replace(/^data:image\/\w+;base64,/, '')
            }
          },
          { text: prompt }
        ]
      }],
    })

    const result = response.response
    console.log('Emotion head response received')

    const candidate = result.candidates?.[0]

    if (!candidate?.content?.parts) {
      console.error('No content in emotion head response')
      return res.status(500).json({ error: 'No content generated' })
    }

    // Find image part
    const imagePart = candidate.content.parts.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    )

    if (imagePart?.inlineData?.data) {
      console.log('Emotion head sprite sheet generated successfully')
      return res.json({
        emotionSheet: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
        gridSize: { columns: 4, rows: 6 },
        emotionOrder,
        intensityLevels: ['mild', 'moderate', 'strong', 'extreme'],
      })
    }

    // Check for text response
    const textPart = candidate.content.parts.find((part: any) => part.text)
    if (textPart?.text) {
      console.log('Got text instead of image:', textPart.text.substring(0, 500))
      return res.status(500).json({
        error: 'Model returned text instead of image',
        message: textPart.text.substring(0, 500)
      })
    }

    return res.status(500).json({ error: 'No emotion head image generated' })

  } catch (error) {
    console.error('Emotion head generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      error: 'Emotion head generation failed',
      message: errorMessage
    })
  }
})

// Legacy endpoint - kept for compatibility
app.post('/api/generate-all-sheets', async (req, res) => {
  // Redirect to new single-sheet endpoint
  const { referenceImage, stylePrompt } = req.body

  if (!referenceImage) {
    return res.status(400).json({
      error: 'Missing required field: referenceImage'
    })
  }

  // Use the new full-sheet generation
  try {
    console.log('Legacy endpoint: redirecting to full-sheet generation')

    const visemeDescriptions: Record<string, string> = {
      Aa: 'wide open mouth (AH/EYE)',
      D: 'tongue behind upper teeth (D/T/N)',
      Ee: 'wide smile showing teeth (EE)',
      F: 'lower lip under teeth (F/V)',
      L: 'tongue tip up behind teeth (L/TH)',
      M: 'lips pressed together (M/B/P)',
      O: 'rounded open mouth (OH)',
      R: 'slightly open, tongue pulled back (R/ER)',
      S: 'teeth together, lips slightly parted (S/Z)',
      U: 'pursed lips (OO/W)',
      W: 'rounded pursed lips (W)',
      Rest: 'closed, relaxed mouth',
    }

    const visemes = ['Aa', 'D', 'Ee', 'F', 'L', 'M', 'O', 'R', 'S', 'U', 'W', 'Rest']
    const visemeList = visemes.map((v, i) => `${i + 1}. ${v}: ${visemeDescriptions[v]}`).join(', ')

    const styleInstruction = stylePrompt ? `\nStyle: ${stylePrompt}` : ''

    const prompt = `Based on this reference character image, generate a sprite sheet showing the character's mouth/lips in different positions.

Create a 12-column × 1-row grid (12 cells total) showing ONLY the mouth area:

${visemeList}

Requirements:
- Keep the EXACT same art style, colors, and character design as the reference
- Show ONLY the mouth/lower face area for each cell
- Each cell must be the same size
- Clean grid layout with visible separation between cells
- White or transparent background
- Maintain consistent lighting and style across all 12 cells${styleInstruction}`

    const model = getVertexAI().getGenerativeModel({
      model: IMAGE_MODEL,
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseModalities: ['TEXT', 'IMAGE'] as any,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    })

    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: referenceImage.replace(/^data:image\/\w+;base64,/, '')
            }
          },
          { text: prompt }
        ]
      }],
    })

    const candidate = response.response.candidates?.[0]
    const imagePart = candidate?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    )

    if (imagePart?.inlineData?.data) {
      console.log('Full sprite sheet generated successfully')
      // Return in the format expected by the frontend
      return res.json({
        fullSheet: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
        gridSize: { columns: 12, rows: 1 },
        visemeOrder: visemes,
      })
    }

    const textPart = candidate?.content?.parts?.find((part: any) => part.text)
    return res.status(500).json({
      error: 'No image generated',
      message: textPart?.text?.substring(0, 500) || 'Unknown error'
    })

  } catch (error) {
    console.error('Generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      error: 'Generation failed',
      message: errorMessage
    })
  }
})

// Global error handler — catches unhandled errors from route handlers
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  Sentry.captureException(err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// Catch-all for unmatched /api/* routes — return 404 JSON (not HTML)
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API route not found' })
})

// Serve frontend static build in production (same domain for OAuth callbacks)
const distPath = path.join(__serverDir, '..', 'dist')
if (fs.existsSync(distPath)) {
  console.log(`📦 Serving frontend from ${distPath}`)
  app.use(express.static(distPath))
  // SPA fallback: serve index.html for any non-API route
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

const PORT = parseInt(process.env.PORT || '3001', 10)
const HOST = '0.0.0.0'  // Bind to all interfaces (required for Railway/Docker)

app.listen(PORT, HOST, async () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`)
  console.log(`   GCP Project: ${projectId}`)
  console.log(`   Location: ${location}`)
  console.log(`   Image Model: ${IMAGE_MODEL}`)
  console.log(`   Claude API: ${isClaudeConfigured() ? 'configured' : 'NOT configured (set ANTHROPIC_API_KEY)'}`)
  console.log(`   Social OAuth: ${isSocialConfigured() ? 'configured' : 'NOT configured (set SUPABASE_URL + SUPABASE_SERVICE_KEY)'}`)
  console.log(`   Stripe: ${isStripeConfigured() ? 'configured' : 'NOT configured (set STRIPE_SECRET_KEY)'}`)
  // Start rembg Python server (non-blocking — logs readiness when done)
  startRembgServer()

  // Check FFmpeg availability at startup (non-blocking with timeout)
  try {
    const ffmpegOk = await Promise.race([
      isFFmpegAvailable(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000)),
    ])
    console.log(`   FFmpeg: ${ffmpegOk ? 'available' : '⚠️  NOT found — AI animation export will fail'}`)
  } catch {
    console.log(`   FFmpeg: ⚠️  check failed`)
  }

  console.log(`   Health check: http://localhost:${PORT}/api/health`)

  // Start auto-publish background scheduler if enabled
  const autoPublishEnabled = process.env.AUTO_PUBLISH_ENABLED !== 'false'
  if (autoPublishEnabled && isSocialConfigured()) {
    startScheduler()
    console.log(`   Auto-Publish: scheduler started (60s poll interval)`)
  } else {
    console.log(`   Auto-Publish: ${!autoPublishEnabled ? 'disabled (AUTO_PUBLISH_ENABLED=false)' : 'disabled (Supabase not configured)'}`)
  }

  // Start metrics auto-refresh poller if Supabase is configured
  if (isSocialConfigured()) {
    startMetricsPoller()
    console.log(`   Metrics Poller: started (6h refresh interval)`)
  } else {
    console.log(`   Metrics Poller: disabled (Supabase not configured)`)
  }
})

// Also start HTTPS server on port 3001 for Instagram OAuth callback (requires https redirect URI)
// Uses a self-signed cert — browser will show a warning, but OAuth redirects work fine
try {
  const certDir = path.join(os.tmpdir(), 'proanimate-ssl')
  const keyPath = path.join(certDir, 'key.pem')
  const certPath = path.join(certDir, 'cert.pem')

  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true })

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('   Generating self-signed SSL cert for HTTPS callback...')
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`,
      { stdio: 'pipe' }
    )
  }

  const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '3443', 10)
  https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, app)
    .listen(HTTPS_PORT, HOST, () => {
      console.log(`🔒 HTTPS server running on ${HOST}:${HTTPS_PORT} (for OAuth callbacks)`)
    })
} catch (err) {
  console.warn('⚠️  HTTPS server not started (openssl may not be available):', (err as Error).message)
}

// Graceful shutdown
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    console.log(`\n${signal} received — shutting down gracefully`)
    stopScheduler()
    stopMetricsPoller()
    process.exit(0)
  })
}
