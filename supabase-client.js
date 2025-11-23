// supabase-client.js

// 1. Import the Supabase client library.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 2. Define your Supabase project credentials.
// IMPORTANT: Replace these with your actual Supabase URL and anon key.
const SUPABASE_URL = 'https://qvoxpfigbukidlmshiei.supabase.co'; // Replace with your Supabase project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2b3hwZmlnYnVraWRsbXNoaWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTM2OTEsImV4cCI6MjA2NTg2OTY5MX0.CEbyeIw6QiMxbLBhU7x7Re7SL_unWJMyaJQPS9y-k60'; // Replace with your Supabase anon key

// 3. Create and export the Supabase client instance.
// This single instance will be imported and used throughout the application.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
