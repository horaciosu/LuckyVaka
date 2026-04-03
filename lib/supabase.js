import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vbfvtbsiuxqeymxbglla.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZnZ0YnNpdXhxZXlteGJnbGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzYyMzgsImV4cCI6MjA5MDc1MjIzOH0.0piKCEepacVzzp7oRVVCAYo8A8pXFd2uiBag52W15yc'

export const supabase = createClient(supabaseUrl, supabaseKey)
