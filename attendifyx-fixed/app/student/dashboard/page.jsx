'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfflineIndicator from '@/components/OfflineIndicator';
import SyncButton from '@/components/SyncButton';
import QRScanner from '@/components/QRScanner';

export default function StudentDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const storedProfile = localStorage.getItem('profile');
    if (!storedProfile) {
      router.push('/');
      return;
    }
    setProfile(JSON.parse(storedProfile));
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [attRes, fbRes, notifRes] = await Promise.all([
        fetch('/api/attendance/list'),
        fetch('/api/feedback/list'),
        fetch('/api/notifications/list')
      ]);

      const attData = await attRes.json();
      const fbData = await fbRes.json();
      const notifData = await notifRes.json();

      if (attData.attendance) setAttendance(attData.attendance);
      if (fbData.feedbacks) setFeedbacks(fbData.feedbacks);
      if (notifData.notifications) {
        setNotifications(notifData.notifications);
        setUnreadCount(notifData.unreadCount);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (qrData) => {
    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_data: JSON.stringify(qrData) })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || 'Failed to mark attendance');
      }
    } catch (err) {
      alert('Error marking attendance: ' + err.message);
    }
    setScanning(false);
  };

  const handleSync = async () => {
    const response = await fetch('/api/attendance/sync', {
      method: 'POST'
    });
    return await response.json();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.clear();
    router.push('/');
  };

  const handleMarkAsRead = async (notificationIds) => {
    await fetch('/api/notifications/list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_ids: notificationIds })
    });
    fetchData();
  };

  const handleMarkAllAsRead = async () => {
    await fetch('/api/notifications/list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all_read: true })
    });
    fetchData();
  };

  const handleSubmitFeedback = async (sessionId, teacherId, message) => {
    const response = await fetch('/api/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, teacher_id: teacherId, message })
    });

    const data = await response.json();
    if (response.ok) {
      alert('Feedback submitted successfully');
      fetchData();
    } else {
      alert(data.error || 'Failed to submit feedback');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117' }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  const presentCount = attendance.length;
  const attendanceRate = presentCount > 0 ? Math.round((presentCount / Math.max(presentCount, 1)) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117' }}>
      <OfflineIndicator />
      
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={{ 
          width: '250px', 
          background: '#1a1d24', 
          padding: '1.5rem',
          borderRight: '1px solid #374151'
        }}>
          <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>
            AttendifyX
          </h2>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('attendance')}
              style={{
                padding: '0.75rem',
                background: activeTab === 'attendance' ? '#2563eb' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 500
              }}
            >
              📊 Attendance
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              style={{
                padding: '0.75rem',
                background: activeTab === 'feedback' ? '#2563eb' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 500
              }}
            >
              💬 Feedback
              {feedbacks.filter(f => f.status === 'reviewed' && !f.is_read).length > 0 && (
                <span style={{ 
                  marginLeft: 'auto', 
                  background: '#ef4444', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem' 
                }}>
                  {feedbacks.filter(f => f.status === 'reviewed' && !f.is_read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              style={{
                padding: '0.75rem',
                background: activeTab === 'notifications' ? '#2563eb' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 500
              }}
            >
              🔔 Notifications
              {unreadCount > 0 && (
                <span style={{ 
                  marginLeft: 'auto', 
                  background: '#ef4444', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem' 
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                padding: '0.75rem',
                background: activeTab === 'settings' ? '#2563eb' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 500
              }}
            >
              ⚙️ Settings
            </button>
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <div style={{ color: '#9ca3af', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, color: 'white' }}>{profile?.full_name}</div>
              <div style={{ fontSize: '0.875rem' }}>{profile?.student_id}</div>
            </div>
            <SyncButton onSync={handleSync} />
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                padding: '0.75rem',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Sign Out
            </button>
          </div>
        </aside>

        <main style={{ flex: 1, padding: '2rem' }}>
          {activeTab === 'attendance' && (
            <>
              <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                My Attendance
              </h1>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Attendance Rate</div>
                  <div style={{ color: '#22c55e', fontSize: '2rem', fontWeight: 700 }}>{attendanceRate}%</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{presentCount} sessions</div>
                </div>
                <div style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Present</div>
                  <div style={{ color: '#22c55e', fontSize: '2rem', fontWeight: 700 }}>{presentCount}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Sessions attended</div>
                </div>
              </div>

              <div style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151', marginBottom: '2rem' }}>
                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Scan QR Code
                </h2>
                {!scanning ? (
                  <button
                    onClick={() => setScanning(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    📷 Start Camera Scanner
                  </button>
                ) : (
                  <div>
                    <QRScanner onScan={handleScan} />
                    <button
                      onClick={() => setScanning(false)}
                      style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Attendance Log
                </h2>
                {attendance.length === 0 ? (
                  <p style={{ color: '#9ca3af' }}>No attendance records yet.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #374151' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>Subject</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>Date</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>Time</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>Method</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((att) => (
                        <tr key={att.id} style={{ borderBottom: '1px solid #374151' }}>
                          <td style={{ padding: '0.75rem', color: 'white' }}>{att.session?.subject}</td>
                          <td style={{ padding: '0.75rem', color: '#9ca3af' }}>
                            {new Date(att.session?.session_date).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.75rem', color: '#9ca3af' }}>
                            {new Date(att.scanned_at).toLocaleTimeString()}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{ 
                              background: '#2563eb', 
                              color: 'white', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.75rem' 
                            }}>
                              {att.method.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{ 
                              background: '#22c55e', 
                              color: 'white', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.75rem' 
                            }}>
                              Present
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeTab === 'feedback' && (
            <>
              <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                Feedback
              </h1>
              {feedbacks.length === 0 ? (
                <div style={{ background: '#1a1d24', padding: '2rem', borderRadius: '8px', border: '1px solid #374151', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af' }}>No feedback submitted yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {feedbacks.map((fb) => (
                    <div key={fb.id} style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'white' }}>{fb.session?.subject}</strong>
                        <span style={{ 
                          background: fb.status === 'reviewed' ? '#22c55e' : '#fbbf24', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem' 
                        }}>
                          {fb.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                        </span>
                      </div>
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        {new Date(fb.created_at).toLocaleString()}
                      </p>
                      <p style={{ color: '#e5e7eb', marginBottom: '0.5rem' }}>{fb.message}</p>
                      {fb.teacher_reply && (
                        <div style={{ background: '#374151', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                          <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            Teacher replied · {new Date(fb.replied_at).toLocaleDateString()}
                          </p>
                          <p style={{ color: '#e5e7eb' }}>{fb.teacher_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    marginBottom: '1rem',
                    padding: '0.5rem 1rem',
                    background: '#374151',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Mark All as Read
                </button>
              )}
              {notifications.length === 0 ? (
                <div style={{ background: '#1a1d24', padding: '2rem', borderRadius: '8px', border: '1px solid #374151', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af' }}>No notifications yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      style={{ 
                        background: notif.is_read ? '#1a1d24' : '#1e3a5f', 
                        padding: '1.5rem', 
                        borderRadius: '8px', 
                        border: notif.is_read ? '1px solid #374151' : '1px solid #2563eb' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'white' }}>{notif.title}</strong>
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ color: '#e5e7eb', marginBottom: '0.5rem' }}>{notif.message}</p>
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkAsRead([notif.id])}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                Settings
              </h1>
              <div style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Profile Information
                </h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={profile?.full_name}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={profile?.email}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Student ID
                    </label>
                    <input
                      type="text"
                      defaultValue={profile?.student_id}
                      disabled
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#374151',
                        border: '1px solid #4b5563',
                        borderRadius: '6px',
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
                <button
                  style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem 1.5rem',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Save Changes
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
