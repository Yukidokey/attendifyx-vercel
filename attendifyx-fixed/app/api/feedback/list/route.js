import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase';

export async function GET(request) {
  const authResult = await requireAuth();
  
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('feedbacks')
      .select(`
        *,
        student:profiles!feedbacks_student_id_fkey(full_name, student_id),
        session:sessions(subject, session_date),
        teacher:profiles!feedbacks_teacher_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (authResult.profile.role === 'student') {
      query = query.eq('student_id', authResult.profile.id);
    } else if (authResult.profile.role === 'teacher') {
      query = query.eq('teacher_id', authResult.profile.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: feedbacks, error } = await query;

    if (error) {
      console.error('Feedbacks fetch error:', error);
      return Response.json(
        { error: 'Failed to fetch feedbacks' },
        { status: 500 }
      );
    }

    return Response.json({
      feedbacks,
      count: feedbacks.length
    });
  } catch (error) {
    console.error('List feedbacks error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
