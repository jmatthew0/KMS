import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase credentials
const supabaseUrl = 'https://wrquexdemaruphereatk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycXVleGRlbWFydXBoZXJlYXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDI3NjYsImV4cCI6MjA4MDMxODc2Nn0.TBL25IO-tgRSNkbOnH-KLUAPemO9vByO58Qk_8B1a7A' // Replace with your actual anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper function to get user profile
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}