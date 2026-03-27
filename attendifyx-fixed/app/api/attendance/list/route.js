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
    const studentId = searchParams.get('student_id');
    const sessionId = searchParams.get('session_id');

    let query = supabase
      .from('attendance')
      .select(`
        *,
        session:sessions(subject, session_date, start_time, teacher_id),
        student:profiles!attendance_student_id_fkey(full_name, student_id),
        teacher:profiles(id, full_name)
      `)
      .order('scanned_at', { ascending: false });

    if (authResult.profile.role === 'student') {
      query = query.eq('student_id', authResult.profile.id);
    } else if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: attendance, error } = await query;

    if (error) {
      console.error('Attendance fetch error:', error);
      return Response.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }

    return Response.json({
      attendance,
      count: attendance.length
    });
  } catch (error) {
    console.error('List attendance error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
