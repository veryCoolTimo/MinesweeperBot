import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fufbcjyefouwyjyabtvy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1ZmJjanllZm91d3lqeWFidHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODM3NjksImV4cCI6MjA4MzQ1OTc2OX0.fVoASX81DAg8xnm3l19rWlSbwyVqK9j5wWDvey3x2qE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
