'use client';

import { useState } from 'react';

export default function SyncButton({ onSync }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncStatus('syncing');

      const result = await onSync();

      if (result.success) {
        setSyncStatus('success');
        setLastSync(new Date());
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }

      return result;
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing': return '#818cf8';
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing': return 'Syncing...';
      case 'success': return 'Synced!';
      case 'error': return 'Failed';
      default: return lastSync ? `Last sync: ${lastSync.toLocaleTimeString()}` : 'Sync Now';
    }
  };

  return (
    <div className="sync-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="btn btn-secondary btn-sm"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: syncing ? 'not-allowed' : 'pointer',
          background: 'transparent',
          color: getStatusColor(),
          border: `1px solid ${getStatusColor()}40`,
          transition: 'all 0.15s'
        }}
      >
        {syncing ? (
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        )}
        {getStatusText()}
      </button>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
