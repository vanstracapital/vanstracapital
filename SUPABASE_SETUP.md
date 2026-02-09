Supabase Integration — Quick Setup

1) Create a Supabase project
- Go to https://app.supabase.com and create a new project.
- Note the project `URL` and the `anon` (public) API key from Project Settings → API.

2) Create database tables
Run the following SQL in Supabase SQL editor to create the minimal tables used by the app:

-- users table
create table if not exists users (
  id text primary key,
  fullName text,
  email text,
  phone text,
  accountNumber text,
  accountType text,
  balance numeric,
  currency text,
  isOnline boolean,
  lastLogin timestamptz,
  createdAt timestamptz
);

-- transactions table
create table if not exists transactions (
  id text primary key,
  userId text references users(id),
  type text,
  subtype text,
  description text,
  amount numeric,
  currency text,
  status text,
  timestamp timestamptz,
  reference text,
  metadata jsonb
);

-- sent_emails table
create table if not exists sent_emails (
  id text primary key,
  "to" text,
  subject text,
  body text,
  timestamp timestamptz
);

3) Configure the client
- Copy `supabase-config.example.js` to `supabase-config.js` in the project root.
- Edit `supabase-config.js` and set `window.SUPABASE_CONFIG.url` and `window.SUPABASE_CONFIG.key` with values from your Supabase project.

Example `supabase-config.js`:

window.SUPABASE_CONFIG = {
  url: 'https://your-project-ref.supabase.co',
  key: 'public-anon-key'
};

// Optionally initialize immediately if you prefer
if (window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.key && window.SupabaseDB) {
  window.SupabaseDB.init(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
}

4) Files included in this project
- `supabase-client.js` — wrapper used by the app. Falls back to `localStorage` when Supabase is not configured.
- `supabase-config.example.js` — example config to copy as `supabase-config.js`.

5) Notes and caveats
- This project currently uses the Supabase client from the browser with a public anon key; for production, route writes through a secure backend or use Row Level Security (RLS) and proper policies.
- The wrapper will not migrate existing localStorage data automatically; you can run a one-off script to push current users to Supabase if desired.
- Passwords and PINs remain hashed client-side for demo only. For production, never store or process unhashed secrets on the client.

6) Optional one-off migration script (run in browser console)

(function migrateLocalToSupabase(){
  if (!window.SupabaseDB || !window.SupabaseDB.initialized) return console.warn('Supabase not initialized');
  const users = JSON.parse(localStorage.getItem('vanstraUsers') || '{}');
  Object.values(users).forEach(async (u) => {
    try { await window.SupabaseDB.createUser(u); console.log('migrated', u.id); } catch (e) { console.warn('migrate failed', u.id, e); }
  });
})();
