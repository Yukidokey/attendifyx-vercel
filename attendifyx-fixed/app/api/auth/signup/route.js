import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { email, password, full_name, role, ...extraData } = await request.json();

    if (!email || !password || !full_name || !role) {
      return Response.json(
        { error: 'Email, password, full name, and role are required' },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role
        }
      }
    });

    if (authError) {
      return Response.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return Response.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    const profileData = {
      id: authData.user.id,
      email,
      full_name,
      role,
      status: 'approved',
      ...extraData
    };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return Response.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    return Response.json({
      user: authData.user,
      profile,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
