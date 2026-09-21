'use client';

import { useEffect } from 'react';
import { setupAuthInterceptor } from '../../lib/authInterceptor';

export default function ClientAuthInit() {
  useEffect(() => {
    setupAuthInterceptor();
  }, []);

  return null;
}
