'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    student_id: '',
    employee_id: '',
    level: 'highschool',
    grade_year: '',
    section: '',
    department: '',
    subject: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      router.push('/?signup=success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117', padding: '1rem' }}>
      <div style={{ 
        maxWidth: '500px', 
        width: '100%', 
        background: '#1a1d24',
        borderRadius: '12px',
        padding: '2.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white', textAlign: 'center' }}>
          Create Account
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '2rem', textAlign: 'center' }}>
          Join AttendifyX today
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['student', 'teacher'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: role === r ? '#2563eb' : '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                textTransform: 'capitalize'
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ 
            padding: '0.75rem', 
            background: '#fee2e2', 
            color: '#dc2626', 
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter your full name"
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
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
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

          {role === 'student' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Student ID
                </label>
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  placeholder="Enter your student ID"
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
                  Education Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
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
                >
                  <option value="highschool">Junior High School</option>
                  <option value="senior_highschool">Senior High School</option>
                  <option value="college">College</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Grade/Year
                </label>
                <input
                  type="text"
                  value={formData.grade_year}
                  onChange={(e) => setFormData({ ...formData, grade_year: e.target.value })}
                  placeholder="e.g., Grade 10, 2nd Year"
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
                  Section
                </label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="e.g., Section A, Room 101"
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
            </>
          )}

          {role === 'teacher' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Employee ID
                </label>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="Enter your employee ID"
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
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Science, Mathematics"
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
                  Subject Specialization
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Physics, English"
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
            </>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#e5e7eb', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Create a password"
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
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              placeholder="Confirm your password"
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <a href="/" style={{ color: '#2563eb' }}>
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
