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
const newPassword = process.argv[3]
if (!email || !newPassword) {
  console.error('Usage: node reset-password-once.mjs <email> <newPassword>')
  process.exit(1)
}

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

const { error: updErr } = await admin.auth.admin.updateUserById(user.id, { password: newPassword })
if (updErr) {
  console.error('updateUserById failed:', updErr.message)
  process.exit(1)
}

console.log('Password updated for', email, '(id:', user.id + ')')
