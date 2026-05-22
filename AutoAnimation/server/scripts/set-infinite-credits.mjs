import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: node set-infinite-credits.mjs <email>')
  process.exit(1)
}

// credit_balances.credits_remaining is int4 (max 2_147_483_647).
// Use a huge value that will effectively never run out.
const INFINITE = 2_000_000_000

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (listErr) {
  console.error('listUsers failed:', listErr.message)
  process.exit(1)
}

const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!user) {
  console.error('User not found for email:', email)
  process.exit(1)
}

const today = new Date().toISOString().split('T')[0]

const { error: upErr } = await admin
  .from('credit_balances')
  .upsert(
    {
      user_id: user.id,
      credits_remaining: INFINITE,
      credits_used_today: 0,
      last_daily_reset: today,
      plan_credits_total: INFINITE,
      period_credits_used: 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

if (upErr) {
  console.error('credit_balances upsert failed:', upErr.message)
  process.exit(1)
}

const { error: subErr } = await admin
  .from('subscriptions')
  .upsert(
    {
      user_id: user.id,
      plan: 'business',
      status: 'active',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

if (subErr) {
  console.warn('subscriptions upsert failed (non-fatal):', subErr.message)
}

console.log('Infinite credits set for', email, '(id:', user.id + ')')
console.log('credits_remaining =', INFINITE.toLocaleString())
