import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

export function getSupabaseClient() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[SUPABASE] Variáveis de ambiente não configuradas (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY).')
    }
    supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
  }
  return supabase
}

export default getSupabaseClient