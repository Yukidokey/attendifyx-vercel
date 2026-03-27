export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase';

export async function POST(request) {
  const authResult = await requireAuth('student');
  
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const { session_id, teacher_id, message } = await request.json();

    if (!session_id || !teacher_id || !message) {
      return Response.json(
        { error: 'Session ID, teacher ID, and message are required' },
        { status: 400 }
      );
    }

    const { data: feedback, error } = await supabase
      .from('feedbacks')
      .upsert({
        student_id: authResult.profile.id,
        session_id,
        teacher_id,
        message,
        status: 'pending',
        validation_status: 'pending'
      }, {
        onConflict: 'student_id,session_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Feedback submission error:', error);
      return Response.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return Response.json({
      feedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
