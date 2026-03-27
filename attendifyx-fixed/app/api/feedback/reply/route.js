export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase';

export async function POST(request) {
  const authResult = await requireAuth('teacher');
  
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const { feedback_id, reply, validation_status } = await request.json();

    if (!feedback_id || !reply) {
      return Response.json(
        { error: 'Feedback ID and reply are required' },
        { status: 400 }
      );
    }

    const { data: feedback, error: fetchError } = await supabase
      .from('feedbacks')
      .select('*, student:profiles!feedbacks_student_id_fkey(full_name, email)')
      .eq('id', feedback_id)
      .eq('teacher_id', authResult.profile.id)
      .single();

    if (fetchError || !feedback) {
      return Response.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('feedbacks')
      .update({
        teacher_reply: reply,
        validation_status: validation_status || 'pending',
        status: 'reviewed',
        replied_at: new Date().toISOString()
      })
      .eq('id', feedback_id)
      .select()
      .single();

    if (updateError) {
      console.error('Feedback reply error:', updateError);
      return Response.json(
        { error: 'Failed to reply to feedback' },
        { status: 500 }
      );
    }

    if (validation_status && validation_status !== 'pending') {
      await supabase
        .from('notifications')
        .insert({
          user_id: feedback.student_id,
          user_type: 'student',
          title: 'Excuse Validation Result',
          message: validation_status === 'valid' 
            ? `Your absence excuse has been VALIDATED by ${authResult.profile.full_name}. Reason: ${reply}`
            : `Your absence excuse has been REJECTED by ${authResult.profile.full_name}. Reason: ${reply}`
        });
    }

    return Response.json({
      feedback: updated,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    console.error('Reply feedback error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
