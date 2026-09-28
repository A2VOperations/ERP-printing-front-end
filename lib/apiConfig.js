function resolveBaseUrl() {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      if (envUrl && !envUrl.includes('onrender.com')) {
        return envUrl.replace(/\/+$/, '');
      }
      return 'http://localhost:5000';
    }
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'https://erp-printing-back-end.onrender.com').replace(/\/+$/, '');
}

export const API_BASE_URL = resolveBaseUrl();

 