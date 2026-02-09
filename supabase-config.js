// supabase-config.js
// Copy your Supabase project values here.
// WARNING: This file contains your public anon key; do not store service_role keys here.

window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || {
  url: 'https://hrxvltgubtxprggobhls.supabase.co', // <-- replace with your Supabase project URL
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeHZsdGd1YnR4cHJnZ29iaGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTU5NjksImV4cCI6MjA4NjE3MTk2OX0.ao0by0GAUnuPSdIutcaBv51UZHRhL4jTURhOMKAwJcQ' // <-- replace with your public anon key
};

// Initialize the Supabase wrapper if present
(function(){
  try {
    if (window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.key && window.SupabaseDB) {
      window.SupabaseDB.init(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
      console.info('Supabase configured (supabase-config.js)');
    } else {
      console.info('supabase-config.js loaded but SupabaseDB or keys not available');
    }
  } catch (e) {
    console.warn('Error initializing SupabaseDB:', e);
  }
})();
