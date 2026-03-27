export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return Response.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      return Response.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.role !== role) {
      return Response.json(
        { error: `This account is not registered as a ${role}` },
        { status: 403 }
      );
    }

    if (profile.status !== 'approved') {
      return Response.json(
        { error: 'Account is pending approval' },
        { status: 403 }
      );
    }

    return Response.json({
      user: data.user,
      profile,
      session: data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
