'use client';

import { useEffect } from 'react';
import { setupAuthInterceptor } from '../../lib/authInterceptor';

export default function ClientAuthInit() {
  useEffect(() => {
    setupAuthInterceptor();

    // Auto-recover from Turbopack dev chunk load mismatches
    const handleChunkError = (event) => {
      const msg = String(event?.message || event?.reason?.message || '');
      const isChunkError =
        msg.includes('ChunkLoadError') ||
        msg.includes('Failed to load chunk') ||
        event?.error?.name === 'ChunkLoadError' ||
        event?.reason?.name === 'ChunkLoadError';

      if (isChunkError && typeof window !== 'undefined') {
        const key = 'crm_last_chunk_reload';
        const now = Date.now();
        const lastReload = parseInt(sessionStorage.getItem(key) || '0', 10);
        if (now - lastReload > 3000) {
          sessionStorage.setItem(key, String(now));
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  return null;
}
