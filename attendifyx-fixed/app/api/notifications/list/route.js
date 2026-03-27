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
    const unreadOnly = searchParams.get('unread_only') === 'true';

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', authResult.profile.id)
      .eq('user_type', authResult.profile.role)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Notifications fetch error:', error);
      return Response.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return Response.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('List notifications error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const authResult = await requireAuth();
  
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const { notification_ids, mark_all_read } = await request.json();

    if (mark_all_read) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', authResult.profile.id)
        .eq('user_type', authResult.profile.role)
        .eq('is_read', false);

      if (error) {
        return Response.json(
          { error: 'Failed to mark all as read' },
          { status: 500 }
        );
      }

      return Response.json({
        message: 'All notifications marked as read'
      });
    } else if (notification_ids && Array.isArray(notification_ids)) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notification_ids)
        .eq('user_id', authResult.profile.id);

      if (error) {
        return Response.json(
          { error: 'Failed to mark notifications as read' },
          { status: 500 }
        );
      }

      return Response.json({
        message: 'Notifications marked as read'
      });
    } else {
      return Response.json(
        { error: 'Either notification_ids or mark_all_read is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Update notifications error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
