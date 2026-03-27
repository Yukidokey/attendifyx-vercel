import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase';

export async function PATCH(request) {
  const authResult = await requireAuth();
  
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const updates = await request.json();
    const { password, ...profileUpdates } = updates;

    if (password) {
      const { error: updateError } = await supabase.auth.updateUser({
        password
      });

      if (updateError) {
        return Response.json(
          { error: 'Failed to update password' },
          { status: 500 }
        );
      }
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', authResult.profile.id)
        .select()
        .single();

      if (profileError) {
        console.error('Profile update error:', profileError);
        return Response.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      return Response.json({
        profile,
        message: 'Profile updated successfully'
      });
    }

    return Response.json({
      message: 'Update successful'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
