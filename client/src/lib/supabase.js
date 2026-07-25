import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Public anon client — safe for reads, respects RLS
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Returns a Supabase client authenticated with the current Clerk user's JWT.
 * Use this for any INSERT/UPDATE/DELETE that needs RLS to identify the user.
 *
 * @param {() => Promise<string|null>} getToken - from Clerk's useAuth() hook
 */
export async function getAuthenticatedSupabase(getToken) {
  if (!supabase) return null;
  try {
    // "supabase" is the name of the JWT template you create in Clerk Dashboard
    const token = await getToken({ template: "supabase" });
    if (!token) return supabase; // fall back to anon if not signed in
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  } catch {
    return supabase;
  }
}

/** True when Supabase env vars are present */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
