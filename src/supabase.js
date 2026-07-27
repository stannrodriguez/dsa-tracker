import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const TABLE = 'tracker_state'
export const SECRET_HEADER = 'x-tracker-secret'

export function hasSupabaseConfig() {
  return Boolean(URL && ANON_KEY)
}

// One client per passphrase: the secret rides on every request as a global header,
// which is what the RLS policies read via current_setting('request.headers', true).
export function makeClient(secret) {
  return createClient(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { [SECRET_HEADER]: secret } },
  })
}
