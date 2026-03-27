import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use placeholder values at build time so Next.js can compile without env vars.
// Real values must be set in Vercel environment variables — requests will fail
// at runtime if they are missing, not at build time.
const resolvedUrl = supabaseUrl || 'https://placeholder.supabase.co';
const resolvedAnonKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(resolvedUrl, resolvedAnonKey);

// Lazy-initialize admin client — only created when actually called at runtime
let _supabaseAdmin = null;
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
}

// Backward-compatible proxy — initializes lazily at runtime
export const supabaseAdmin = new Proxy({}, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop];
  }
});

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function requireAuth(requiredRole = null) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', user: null, profile: null };
  }

  const profile = await getUserProfile(user.id);
  if (!profile) {
    return { error: 'Profile not found', user, profile: null };
  }

  if (requiredRole && profile.role !== requiredRole) {
    return { error: `Requires ${requiredRole} role`, user, profile };
  }

  return { error: null, user, profile };
}
