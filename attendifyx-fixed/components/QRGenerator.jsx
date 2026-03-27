'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { generateDataQrCode } from '@/lib/qr-utils';

export default function QRGenerator({ session, size = 300 }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function generateQR() {
      try {
        setLoading(true);
        setError(null);

        const sessionData = {
          id: session.id,
          session_code: session.session_code,
          subject: session.subject,
          teacher_name: session.teacher?.full_name || 'Teacher',
          session_date: session.session_date,
          start_time: session.start_time
        };

        const result = await generateDataQrCode(sessionData);
        setQrDataUrl(result.qrDataUrl);
      } catch (err) {
        console.error('QR generation error:', err);
        setError('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      generateQR();
    }
  }, [session]);

  if (loading) {
    return (
      <div 
        className="qr-placeholder" 
        style={{ 
          width: size, 
          height: size, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f0f0f0',
          borderRadius: '8px'
        }}
      >
        Generating QR...
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="qr-error" 
        style={{ 
          width: size, 
          height: size, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#fee2e2',
          color: '#dc2626',
          borderRadius: '8px'
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div className="qr-code-wrapper">
      <img 
        src={qrDataUrl} 
        alt="Attendance QR Code" 
        style={{ 
          width: size, 
          height: 'auto',
          background: 'white',
          padding: '10px',
          borderRadius: '8px',
          border: '2px solid #e5e7eb'
        }} 
      />
      <div className="qr-info" style={{ marginTop: '0.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Scan to mark attendance
        </p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          Code: <code style={{ color: '#2563eb' }}>{session.session_code}</code>
        </p>
      </div>
    </div>
  );
}
