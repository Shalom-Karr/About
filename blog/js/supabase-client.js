// js/supabase-client.js

// Safely check for environment variables
function getEnv(key, fallback) {
    if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) return window.ENV[key];
    return fallback;
}

const SUPABASE_URL = getEnv('SUPABASE_URL', '');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY', '');

// Initialize the global supabase client ONLY if valid credentials exist
if (SUPABASE_URL.startsWith('http')) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase Client Initialized locally.');
} else {
    console.warn("Supabase Client failed to initialize: Invalid or missing SUPABASE_URL environment variable.");
}
