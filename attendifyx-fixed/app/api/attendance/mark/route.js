export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase';
import { parseQrData } from '@/lib/qr-utils';
import { saveAttendanceOffline, getSessionByToken, isOnline, syncOfflineData } from '@/lib/offline-storage';

export async function POST(request) {
  const authResult = await requireAuth('student');
  
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const { qr_data, method = 'qr', session_id } = await request.json();

    let sessionData = null;
    let sessionId = session_id;

    if (qr_data) {
      const qrResult = parseQrData(qr_data);
      
      if (!qrResult.valid) {
        return Response.json(
          { error: qrResult.error },
          { status: 400 }
        );
      }

      sessionId = qrResult.data.session_id;
    }

    if (!sessionId) {
      return Response.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const online = await isOnline();

    if (online) {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .is('deleted_at', null)
        .single();

      if (sessionError || !session) {
        return Response.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      if (session.status !== 'active') {
        return Response.json(
          { error: 'This session has been closed' },
          { status: 400 }
        );
      }

      const { data: existing, error: checkError } = await supabase
        .from('attendance')
        .select('id')
        .eq('session_id', sessionId)
        .eq('student_id', authResult.profile.id)
        .single();

      if (existing) {
        return Response.json(
          { error: 'Attendance already marked for this session' },
          { status: 400 }
        );
      }

      const { data: attendance, error: attendError } = await supabase
        .from('attendance')
        .insert({
          session_id: sessionId,
          student_id: authResult.profile.id,
          method,
          synced: true
        })
        .select(`
          *,
          session:sessions(subject, session_date, start_time),
          student:profiles!attendance_student_id_fkey(full_name)
        `)
        .single();

      if (attendError) {
        console.error('Attendance marking error:', attendError);
        return Response.json(
          { error: 'Failed to mark attendance' },
          { status: 500 }
        );
      }

      return Response.json({
        attendance,
        message: 'Attendance marked successfully'
      });
    } else {
      const offlineSession = await getSessionByToken(sessionId);

      if (!offlineSession) {
        return Response.json(
          { error: 'Session not found (offline mode)' },
          { status: 404 }
        );
      }

      if (offlineSession.status !== 'active') {
        return Response.json(
          { error: 'This session has been closed' },
          { status: 400 }
        );
      }

      const attendance = await saveAttendanceOffline({
        session_id: sessionId,
        student_id: authResult.profile.id,
        method,
        scanned_at: new Date().toISOString()
      });

      return Response.json({
        attendance,
        offline: true,
        message: 'Attendance saved offline. Will sync when online.'
      });
    }
  } catch (error) {
    console.error('Mark attendance error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
