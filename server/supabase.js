// supabase.js — service-role Supabase client for server use only
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client.
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      // Disable auto-refresh — not needed in a server context
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = { supabase };
