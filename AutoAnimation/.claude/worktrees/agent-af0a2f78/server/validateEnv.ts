/**
 * Startup environment variable validation.
 * Validates all required and optional API keys at boot time.
 * Fails fast with clear error messages if critical vars are missing.
 */

interface EnvVar {
  key: string
  required: boolean
  description: string
}

const ENV_VARS: EnvVar[] = [
  // GCP / Vertex AI
  { key: 'GCP_PROJECT_ID', required: false, description: 'Google Cloud project ID for Vertex AI sprite/emotion generation' },
  { key: 'GCP_LOCATION', required: false, description: 'GCP region (defaults to us-central1)' },

  // Anthropic (Claude)
  { key: 'ANTHROPIC_API_KEY', required: false, description: 'Claude API key for AI animation pipeline' },

  // Stripe
  { key: 'STRIPE_SECRET_KEY', required: false, description: 'Stripe secret key for billing' },
  { key: 'STRIPE_WEBHOOK_SECRET', required: false, description: 'Stripe webhook signing secret' },

  // Supabase
  { key: 'SUPABASE_URL', required: false, description: 'Supabase project URL for auth/storage' },
  { key: 'SUPABASE_SERVICE_KEY', required: false, description: 'Supabase service role key' },

  // Meshy
  { key: 'MESHY_API_KEY', required: false, description: 'Meshy API key for text-to-3D generation' },

  // Recraft
  { key: 'RECRAFT_API_TOKEN', required: false, description: 'Recraft API token for background removal' },

  // PORT
  { key: 'PORT', required: false, description: 'Server port (defaults to 3001)' },
]

export function validateEnv(): void {
  const missing: string[] = []
  const warnings: string[] = []

  for (const v of ENV_VARS) {
    const value = process.env[v.key]
    if (!value || value.trim() === '') {
      if (v.required) {
        missing.push(`  ${v.key} — ${v.description}`)
      } else {
        warnings.push(`  ${v.key} — ${v.description}`)
      }
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ Missing REQUIRED environment variables:\n')
    missing.forEach((m) => console.error(m))
    console.error('\nSet these in server/.env or as environment variables.\n')
    process.exit(1)
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Optional environment variables not set (some features will be unavailable):')
    warnings.forEach((w) => console.warn(w))
    console.warn('')
  }
}
