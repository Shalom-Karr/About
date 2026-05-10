// Supabase config for Pages Functions.
//
// These same values are committed in /supabase-client.js (the file the
// browser loads) and are public — the anon key is exposed to every
// visitor of the site, so there is no security loss in checking them
// in here. Keeping them in source means the sitemap function works
// regardless of whether the build env-var injection runs.
//
// scripts/inject-env.js will overwrite this file at build time if
// SUPABASE_URL / SUPABASE_ANON_KEY env vars are present, but the
// committed values below are the source of truth otherwise.

export const SUPABASE_URL      = 'https://qvoxpfigbukidlmshiei.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2b3hwZmlnYnVraWRsbXNoaWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTM2OTEsImV4cCI6MjA2NTg2OTY5MX0.CEbyeIw6QiMxbLBhU7x7Re7SL_unWJMyaJQPS9y-k60';
