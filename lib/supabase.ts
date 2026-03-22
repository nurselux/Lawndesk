import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

declare global {
  var supabaseInstance: ReturnType<typeof createClient> | undefined
}

export const supabase = globalThis.supabaseInstance ?? createClient(supabaseUrl, supabaseKey)

if (process.env.NODE_ENV !== 'production') {
  globalThis.supabaseInstance = supabase
}