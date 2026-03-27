import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Lazy-initialize admin client so missing service key only throws when actually used
let _supabaseAdmin = null;
export function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
}

// Keep backward-compatible export as a getter-based proxy
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
