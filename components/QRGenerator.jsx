'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function QRGenerator({ sessionData, size = 256 }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionData) {
      generateQRCode();
    }
  }, [sessionData]);

  const generateQRCode = async () => {
    if (!sessionData) return;

    setLoading(true);
    setError(null);

    try {
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(sessionData), {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeUrl(qrDataUrl);
    } catch (err) {
      console.error('QR Code generation failed:', err);
      setError('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-${sessionData.session_code || 'session'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!sessionData) {
    return (
      <div className="qr-generator-container">
        <div className="alert alert-warning">
          No session data provided for QR code generation
        </div>
      </div>
    );
  }

  return (
    <div className="qr-generator-container">
      <div className="qr-code-wrapper">
        {loading ? (
          <div className="loading-container" style={{ 
            width: size, 
            height: size, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px dashed #374151',
            borderRadius: '8px'
          }}>
            <div className="animate-spin">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            </div>
          </div>
        ) : error ? (
          <div className="error-container" style={{ 
            width: size, 
            height: size, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px dashed #ef4444',
            borderRadius: '8px',
            color: '#ef4444'
          }}>
            <span>{error}</span>
          </div>
        ) : qrCodeUrl ? (
          <div className="qr-code-display">
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              style={{ 
                width: size, 
                height: size, 
                border: '2px solid #374151',
                borderRadius: '8px',
                padding: '8px',
                background: 'white'
              }} 
            />
          </div>
        ) : null}
      </div>

      <div className="qr-info" style={{ marginTop: '1rem' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>Session Details:</h4>
        <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
          <p><strong>Session Code:</strong> {sessionData.session_code}</p>
          <p><strong>Subject:</strong> {sessionData.subject}</p>
          <p><strong>Time:</strong> {sessionData.start_time} - {sessionData.end_time}</p>
        </div>
      </div>

      {qrCodeUrl && (
        <div className="qr-actions" style={{ marginTop: '1rem' }}>
          <button
            onClick={downloadQRCode}
            className="btn btn-secondary btn-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download QR Code
          </button>
        </div>
      )}
    </div>
  );
}
