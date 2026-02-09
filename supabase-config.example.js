// Copy this file to `supabase-config.js` and fill in your project details.
// Then include it on pages that need Supabase before `supabase-client.js`.

// Example:
// window.SUPABASE_CONFIG = {
//   url: 'https://xyzcompany.supabase.co',
//   key: 'public-anon-key'
// };

(function(){
    window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || {
        url: '',
        key: ''
    };

    // If you prefer automatic initialization, uncomment and fill values above
    if (window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.key && window.SupabaseDB) {
        window.SupabaseDB.init(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
    }
})();
