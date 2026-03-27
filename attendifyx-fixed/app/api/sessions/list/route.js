export const dynamic = 'force-dynamic';

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
    const includeDeleted = searchParams.get('include_deleted') === 'true';

    let query = supabase
      .from('sessions')
      .select(`
        *,
        teacher:profiles!sessions_teacher_id_fkey(full_name),
        attendance(count)
      `);

    if (authResult.profile.role === 'teacher') {
      query = query.eq('teacher_id', authResult.profile.id);
    }

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    } else {
      query = query.not('deleted_at', 'is', null);
    }

    query = query.order('created_at', { ascending: false });

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Sessions fetch error:', error);
      return Response.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return Response.json({
      sessions,
      count: sessions.length
    });
  } catch (error) {
    console.error('List sessions error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
