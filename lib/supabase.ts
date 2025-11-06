/**
 * Supabase Client Configuration
 * 
 * This file sets up the Supabase client to interact with the Supabase database.
 * The client is created using the Supabase URL and anonymous key from environment variables.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Variable to store the Supabase client instance
let supabaseClient: SupabaseClient | null = null

/**
 * Get or create the Supabase client
 * This function creates the client lazily to avoid errors during build time
 * when environment variables might not be available
 */
export const getSupabaseClient = (): SupabaseClient => {
  // If client already exists, return it
  if (supabaseClient) {
    return supabaseClient
  }

  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate that environment variables are set
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key must be set in environment variables')
  }

  // Create and store the Supabase client
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

// Export the client for convenience (will be initialized when first used)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient]
  }
})

