import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase';

export async function GET(request, { params }) {
  const authResult = await requireAuth();
  
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        *,
        teacher:profiles!sessions_teacher_id_fkey(full_name, email),
        attendance(count)
      `)
      .eq('id', params.id)
      .is('deleted_at', null)
      .single();

    if (error || !session) {
      return Response.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return Response.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const authResult = await requireAuth('teacher');
  
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const updates = await request.json();

    const { data: session, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', params.id)
      .eq('teacher_id', authResult.profile.id)
      .select()
      .single();

    if (error || !session) {
      return Response.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return Response.json({
      session,
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Update session error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const authResult = await requireAuth('teacher');
  
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      const { data: session } = await supabase
        .from('sessions')
        .select('subject, session_date')
        .eq('id', params.id)
        .eq('teacher_id', authResult.profile.id)
        .single();

      if (session) {
        await supabase
          .from('attendance')
          .update({
            session_snapshot: `${session.subject} | ${session.session_date}`
          })
          .eq('session_id', params.id);
      }

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', params.id)
        .eq('teacher_id', authResult.profile.id);

      if (error) {
        return Response.json(
          { error: 'Failed to delete session' },
          { status: 500 }
        );
      }

      return Response.json({
        message: 'Session permanently deleted'
      });
    } else {
      const { error } = await supabase
        .from('sessions')
        .update({
          deleted_at: new Date().toISOString(),
          status: 'closed'
        })
        .eq('id', params.id)
        .eq('teacher_id', authResult.profile.id);

      if (error) {
        return Response.json(
          { error: 'Failed to move session to recycle bin' },
          { status: 500 }
        );
      }

      return Response.json({
        message: 'Session moved to recycle bin'
      });
    }
  } catch (error) {
    console.error('Delete session error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
