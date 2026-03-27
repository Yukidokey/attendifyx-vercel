'use client';

import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#fbbf24',
        color: '#92400e',
        padding: '0.75rem',
        textAlign: 'center',
        zIndex: 9999,
        fontWeight: 600,
        fontSize: '0.875rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      ⚠️ You are offline. Attendance will be saved locally and synced when you're back online.
    </div>
  );
}
