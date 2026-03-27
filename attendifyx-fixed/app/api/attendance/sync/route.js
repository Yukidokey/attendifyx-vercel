export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/supabase';
import { syncOfflineData } from '@/lib/offline-storage';

export async function POST(request) {
  const authResult = await requireAuth('student');
  
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const result = await syncOfflineData(supabase);

    return Response.json(result);
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
