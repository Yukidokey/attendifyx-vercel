export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase';
import { generateSessionCode, generateQrToken } from '@/lib/qr-utils';

export async function POST(request) {
  const authResult = await requireAuth('teacher');
  
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const { subject, description, session_date, start_time, end_time } = await request.json();

    if (!subject || !session_date || !start_time) {
      return Response.json(
        { error: 'Subject, session date, and start time are required' },
        { status: 400 }
      );
    }

    const session_code = generateSessionCode();
    const qr_token = generateQrToken();

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        teacher_id: authResult.profile.id,
        session_code,
        subject,
        description,
        session_date,
        start_time,
        end_time,
        qr_token,
        status: 'active'
      })
      .select(`
        *,
        teacher:profiles!sessions_teacher_id_fkey(full_name)
      `)
      .single();

    if (error) {
      console.error('Session creation error:', error);
      return Response.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return Response.json({
      session,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Create session error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
