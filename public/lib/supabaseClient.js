// Supabase Configuration
const SUPABASE_URL = 'https://zsnzfbphhomncutpbegw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbnpmYnBoaG9tbmN1dHBiZWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Njk2MDAsImV4cCI6MjA4OTI0NTYwMH0.P6biybUkJ1apbzi8KoRjeN4jbkyxIGQmEBhge25XIK8';

// Wait for Supabase to be available from CDN
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.supabase !== 'undefined') {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabase };
}
