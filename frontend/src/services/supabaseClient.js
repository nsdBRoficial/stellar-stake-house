import { createClient } from '@supabase/supabase-js'

let cachedClient = null

export default function getSupabaseClient() {
  if (cachedClient) return cachedClient
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (url && anonKey) {
    cachedClient = createClient(url, anonKey)
    return cachedClient
  }
  console.warn('[SUPABASE] Variáveis ausentes: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Usando stub.')
  cachedClient = {
    auth: {
      async getSession() { return { data: null } },
      async signInWithPassword() { throw new Error('Supabase não configurado (VITE_SUPABASE_...)') },
      async signInWithOAuth() { throw new Error('Supabase não configurado (VITE_SUPABASE_...)') },
      async signOut() { return { data: null } }
    }
  }
  return cachedClient
}
