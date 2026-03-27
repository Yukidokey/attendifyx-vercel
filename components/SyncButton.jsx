'use client';

import { useState, useEffect } from 'react';

export default function SyncButton({ onSync, className = '' }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    // Load last sync time from localStorage
    const savedLastSync = localStorage.getItem('lastSyncTime');
    if (savedLastSync) {
      setLastSync(new Date(savedLastSync));
    }

    // Load sync status
    const savedStatus = localStorage.getItem('syncStatus');
    if (savedStatus) {
      setSyncStatus(savedStatus);
    }
  }, []);

  const handleSync = async () => {
    if (syncing) return;

    setSyncing(true);
    setSyncStatus(null);

    try {
      // Call the sync function if provided
      if (onSync) {
        await onSync();
      }

      // Default sync logic - call sync API
      const response = await fetch('/api/attendance/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSyncStatus('success');
        setLastSync(new Date());
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        localStorage.setItem('syncStatus', 'success');
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setSyncStatus(null);
          localStorage.removeItem('syncStatus');
        }, 3000);
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      localStorage.setItem('syncStatus', 'error');
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setSyncStatus(null);
        localStorage.removeItem('syncStatus');
      }, 5000);
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`sync-button-container ${className}`}>
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`btn ${syncing ? 'btn-secondary' : 'btn-primary'}`}
        style={{
          position: 'relative',
          minWidth: '120px'
        }}
      >
        {syncing ? (
          <>
            <span className="animate-spin" style={{ marginRight: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            </span>
            Syncing...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
              <polyline points="23,4 23,10 17,10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Sync Data
          </>
        )}
      </button>

      <div className="sync-info" style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
        Last sync: {formatLastSync(lastSync)}
      </div>

      {syncStatus === 'success' && (
        <div className="sync-status success" style={{ 
          fontSize: '0.75rem', 
          color: '#22c55e', 
          marginTop: '0.25rem',
          fontWeight: 500
        }}>
          ✓ Sync completed successfully
        </div>
      )}

      {syncStatus === 'error' && (
        <div className="sync-status error" style={{ 
          fontSize: '0.75rem', 
          color: '#ef4444', 
          marginTop: '0.25rem',
          fontWeight: 500
        }}>
          ✗ Sync failed. Try again.
        </div>
      )}
    </div>
  );
}
