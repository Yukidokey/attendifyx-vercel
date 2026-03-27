'use client';

import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showScanRegionIfSupported: true
        },
        false
      );

      scanner.render(
        (decodedText, decodedResult) => {
          try {
            const qrData = JSON.parse(decodedText);
            onScan(qrData);
            scanner.clear();
            scannerRef.current = null;
            setScanning(false);
          } catch (e) {
            setError('Invalid QR code format');
            if (onError) onError(e);
          }
        },
        (errorMessage) => {
          console.warn('QR scan warning:', errorMessage);
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [scanning, onScan, onError]);

  const startScanning = () => {
    setError(null);
    setScanning(true);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        scannerRef.current = null;
        setScanning(false);
      });
    }
  };

  return (
    <div className="qr-scanner-container">
      {!scanning ? (
        <button
          onClick={startScanning}
          className="btn btn-primary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Start Camera Scanner
        </button>
      ) : (
        <div className="scanner-wrapper">
          <div id="qr-reader" className="qr-reader"></div>
          <button
            onClick={stopScanning}
            className="btn btn-danger btn-sm"
            style={{ marginTop: '1rem' }}
          >
            Stop Scanning
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}
