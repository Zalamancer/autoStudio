# server/ Workspace

Express.js backend for ProAnimate. Handles AI provider proxying, payment processing, auth verification, asset management, and the public API. Runs on port 3001; Vite proxies `/api` requests to it in development.

## Architecture

```
server/
  index.ts          # App setup, CORS, rate limiting, route mounting (40+ route modules)
  validateEnv.ts    # Startup env var validation (fails fast on missing required vars)
  routes/           # Express Router modules (one file per feature domain)
  services/         # Server-side business logic (AI providers, encoding, scoring)
  middleware/        # Auth, validation, usage logging, error handling
  jobs/             # Background schedulers (metrics polling, scheduled tasks)
  workers/          # Background job processors
  python/           # Python scripts (Manim rendering, ML tasks)
  schemas/          # Request/response validation schemas
  openapi.yaml      # API specification
  routes/v1/        # Public API v1 (renders, api-keys, webhooks, voices, characters, templates, projects, translate)
```

## Route pattern

Every route file exports an Express Router. Mounted in `index.ts` as:
```
app.use('/api/<domain>', [middleware...], domainRoutes)
```

Most AI routes use: `requireAuth` + `aiRateLimiter` (20 req/min/IP).

## Middleware stack

| Middleware | File | Purpose |
|-----------|------|---------|
| `requireAuth` | `supabaseAuth.ts` | Verifies Supabase JWT, attaches `req.userId` and `req.userEmail` |
| `requireEnterprise` | `supabaseAuth.ts` | Checks subscription plan is enterprise |
| `requireOptedIn` | `supabaseAuth.ts` | Checks creator profile opt-in |
| `requireApiKey` | `apiKeyAuth.ts` | API key auth for public API v1 routes |
| `aiRateLimiter` | `index.ts` (inline) | 20 req/min rate limit on AI endpoints |
| `usageLogger` | `usageLogger.ts` | Logs API usage metrics |
| `validate` | `validate.ts` | Request body/params validation |

## Auth flow

1. Frontend sends Supabase JWT in `Authorization: Bearer <token>` header
2. `requireAuth` calls `supabase.auth.getUser(token)` using service role client
3. On success, `req.userId` and `req.userEmail` are set for downstream handlers
4. Supabase admin client (`getSupabaseAdmin()`) uses service role key to bypass RLS

## Key services

| Service | What it does |
|---------|-------------|
| `claude.ts` | Anthropic Claude API for SVG animation code generation |
| `manimCodeGenerator.ts` + `manimRenderer.ts` | Manim video generation pipeline |
| `orchestratorRunner.ts` | Executes orchestrator plans server-side |
| `stripeService.ts` | Stripe billing, subscriptions, webhook processing |
| `encoder.ts` | FFmpeg-based video encoding |
| `geminiAnalysis.ts` | Gemini AI analysis calls |
| `scoringModel.ts` | Virality/content scoring |
| `socialPublisher.ts` | Social media publishing |

## Environment variables (server/.env)

All optional at startup (graceful degradation), but features won't work without them:
`GCP_PROJECT_ID`, `GCP_LOCATION`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `MESHY_API_KEY`, `RECRAFT_API_TOKEN`, `PORT`

## Special patterns

- Stripe webhook route mounts BEFORE `express.json()` (needs raw body for signature verification)
- Status check endpoints (e.g., `/api/recraft/status`) are public (no auth) so frontend can check availability before login
- JSON body limit is 100MB to handle base64-encoded images and audio
