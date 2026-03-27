'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfflineIndicator from '@/components/OfflineIndicator';
import QRGenerator from '@/components/QRGenerator';

export default function TeacherDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSession, setNewSession] = useState({
    subject: '',
    description: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: ''
  });

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
      
      const [sessionsRes, feedbacksRes] = await Promise.all([
        fetch('/api/sessions/list'),
        fetch('/api/feedback/list')
      ]);

      const sessionsData = await sessionsRes.json();
      const feedbacksData = await feedbacksRes.json();

      if (sessionsData.sessions) {
        setSessions(sessionsData.sessions);
        setActiveSessions(sessionsData.sessions.filter(s => s.status === 'active'));
      }
      if (feedbacksData.feedbacks) setFeedbacks(feedbacksData.feedbacks);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Session created successfully!');
        setShowCreateModal(false);
        setNewSession({
          subject: '',
          description: '',
          session_date: new Date().toISOString().split('T')[0],
          start_time: '',
          end_time: ''
        });
        fetchData();
      } else {
        alert(data.error || 'Failed to create session');
      }
    } catch (err) {
      alert('Error creating session: ' + err.message);
    }
  };

  const handleCloseSession = async (sessionId) => {
    if (!confirm('Close this session? Attendance will be saved.')) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', end_time: new Date().toISOString().split('T')[1].substring(0, 5) })
      });

      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to close session');
      }
    } catch (err) {
      alert('Error closing session: ' + err.message);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Move this session to recycle bin?')) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to delete session');
      }
    } catch (err) {
      alert('Error deleting session: ' + err.message);
    }
  };

  const handleReplyFeedback = async (feedbackId, reply, validationStatus) => {
    try {
      const response = await fetch('/api/feedback/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_id: feedbackId,
          reply,
          validation_status: validationStatus
        })
      });

      if (response.ok) {
        alert('Reply sent successfully!');
        fetchData();
      } else {
        alert('Failed to send reply');
      }
    } catch (err) {
      alert('Error sending reply: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.clear();
    router.push('/');
  };

  const pendingFeedbacks = feedbacks.filter(f => f.status === 'pending');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117' }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

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
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '0.75rem',
                background: activeTab === 'overview' ? '#2563eb' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 500
              }}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              style={{
                padding: '0.75rem',
                background: activeTab === 'sessions' ? '#2563eb' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 500
              }}
            >
              📅 Sessions
              {activeSessions.length > 0 && (
                <span style={{ 
                  marginLeft: 'auto', 
                  background: '#22c55e', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem' 
                }}>
                  {activeSessions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('feedbacks')}
              style={{
                padding: '0.75rem',
                background: activeTab === 'feedbacks' ? '#2563eb' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 500
              }}
            >
              💬 Feedback
              {pendingFeedbacks.length > 0 && (
                <span style={{ 
                  marginLeft: 'auto', 
                  background: '#ef4444', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem' 
                }}>
                  {pendingFeedbacks.length}
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
              <div style={{ fontSize: '0.875rem' }}>Teacher</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
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
          {activeTab === 'overview' && (
            <>
              <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                Overview
              </h1>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Sessions</div>
                  <div style={{ color: 'white', fontSize: '2rem', fontWeight: 700 }}>{sessions.length}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>All time</div>
                </div>
                <div style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Active Now</div>
                  <div style={{ color: '#22c55e', fontSize: '2rem', fontWeight: 700 }}>{activeSessions.length}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Open sessions</div>
                </div>
                <div style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pending Feedback</div>
                  <div style={{ color: '#fbbf24', fontSize: '2rem', fontWeight: 700 }}>{pendingFeedbacks.length}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Awaiting reply</div>
                </div>
              </div>

              {activeSessions.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Active Sessions
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {activeSessions.map((session) => (
                      <div key={session.id} style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>{session.subject}</div>
                            <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                              {session.session_date} · {session.start_time}
                            </div>
                          </div>
                          <span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                            Live
                          </span>
                        </div>
                        
                        <QRGenerator session={session} size={200} />
                        
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                            Attendees: <span style={{ color: '#2563eb', fontWeight: 600 }}>{session.attendance?.[0]?.count || 0}</span>
                          </div>
                          <button
                            onClick={() => handleCloseSession(session.id)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 500
                            }}
                          >
                            Close Session
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Recent Sessions
                </h2>
                <div style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                  {sessions.length === 0 ? (
                    <p style={{ color: '#9ca3af' }}>No sessions yet.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #374151' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>Subject</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>Date</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>Time</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>Attendees</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.slice(0, 10).map((session) => (
                          <tr key={session.id} style={{ borderBottom: '1px solid #374151' }}>
                            <td style={{ padding: '0.75rem', color: 'white' }}>{session.subject}</td>
                            <td style={{ padding: '0.75rem', color: '#9ca3af' }}>
                              {new Date(session.session_date).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#9ca3af' }}>{session.start_time}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ 
                                background: '#2563eb', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem' 
                              }}>
                                {session.attendance?.[0]?.count || 0}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ 
                                background: session.status === 'active' ? '#22c55e' : '#6b7280', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem' 
                              }}>
                                {session.status === 'active' ? 'Active' : 'Closed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'sessions' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 600 }}>
                  My Sessions
                </h1>
                <button
                  onClick={() => setShowCreateModal(true)}
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
                  + New Session
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {sessions.map((session) => (
                  <div key={session.id} style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ color: 'white', fontWeight: 600 }}>{session.subject}</div>
                      <span style={{ 
                        background: session.status === 'active' ? '#22c55e' : '#6b7280', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem' 
                      }}>
                        {session.status === 'active' ? 'Live' : 'Closed'}
                      </span>
                    </div>
                    
                    {session.description && (
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                        {session.description}
                      </p>
                    )}
                    
                    <div style={{ color: '#e5e7eb', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {new Date(session.session_date).toLocaleDateString()} · {session.start_time}
                    </div>

                    {session.status === 'active' && (
                      <>
                        <QRGenerator session={session} size={200} />
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                            Attendees: <span style={{ color: '#2563eb', fontWeight: 600 }}>{session.attendance?.[0]?.count || 0}</span>
                          </div>
                          <button
                            onClick={() => handleCloseSession(session.id)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 500
                            }}
                          >
                            Close Session
                          </button>
                        </div>
                      </>
                    )}

                    {session.status === 'closed' && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'feedbacks' && (
            <>
              <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                Feedback & Approvals
              </h1>
              {feedbacks.length === 0 ? (
                <div style={{ background: '#1a1d24', padding: '2rem', borderRadius: '8px', border: '1px solid #374151', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af' }}>No feedback received yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {feedbacks.map((fb) => (
                    <div key={fb.id} style={{ background: '#1a1d24', padding: '1.5rem', borderRadius: '8px', border: '1px solid #374151' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div>
                          <strong style={{ color: 'white' }}>{fb.session?.subject}</strong>
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                            · {fb.student?.full_name} ({fb.student?.student_id})
                          </span>
                        </div>
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
                      <p style={{ color: '#e5e7eb', marginBottom: '1rem' }}>{fb.message}</p>
                      
                      {fb.status === 'pending' && (
                        <div style={{ background: '#374151', padding: '1rem', borderRadius: '6px' }}>
                          <textarea
                            placeholder="Type your reply..."
                            id={`reply-${fb.id}`}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: '#1a1d24',
                              border: '1px solid #4b5563',
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '0.875rem',
                              marginBottom: '0.75rem',
                              minHeight: '80px'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                const reply = document.getElementById(`reply-${fb.id}`).value;
                                handleReplyFeedback(fb.id, reply, 'valid');
                              }}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500
                              }}
                            >
                              ✓ Validate
                            </button>
                            <button
                              onClick={() => {
                                const reply = document.getElementById(`reply-${fb.id}`).value;
                                handleReplyFeedback(fb.id, reply, 'not_valid');
                              }}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500
                              }}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {fb.teacher_reply && (
                        <div style={{ background: '#374151', padding: '0.75rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                          <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            Teacher replied · {new Date(fb.replied_at).toLocaleDateString()}
                          </p>
                          <p style={{ color: '#e5e7eb' }}>{fb.teacher_reply}</p>
                          {fb.validation_status && (
                            <span style={{ 
                              display: 'inline-block',
                              marginTop: '0.5rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              background: fb.validation_status === 'valid' ? '#22c55e' : '#ef4444',
                              color: 'white'
                            }}>
                              {fb.validation_status === 'valid' ? '✓ Validated' : '✗ Rejected'}
                            </span>
                          )}
                        </div>
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
                      Department
                    </label>
                    <input
                      type="text"
                      defaultValue={profile?.department}
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
                      Subject
                    </label>
                    <input
                      type="text"
                      defaultValue={profile?.subject}
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

      {showCreateModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.7)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            background: '#1a1d24', 
            padding: '2rem', 
            borderRadius: '12px', 
            maxWidth: '500px', 
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              Create New Session
            </h2>
            <form onSubmit={handleCreateSession}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={newSession.subject}
                  onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                  placeholder="e.g., Mathematics, Physics"
                  required
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Description
                </label>
                <textarea
                  value={newSession.description}
                  onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={newSession.session_date}
                  onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                  required
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Start Time *
                </label>
                <input
                  type="time"
                  value={newSession.start_time}
                  onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                  required
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  End Time (Optional)
                </label>
                <input
                  type="time"
                  value={newSession.end_time}
                  onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
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

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Create Session
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#374151',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
