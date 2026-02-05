'use client'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Return a mock client for build time / missing env
    return createSupabaseClient('https://placeholder.supabase.co', 'placeholder-key')
  }

  return createSupabaseClient(url, key)
}
