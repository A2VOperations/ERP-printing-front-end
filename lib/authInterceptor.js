import { supabase } from './supabaseClient';
import { API_BASE_URL } from './apiConfig';

/**
 * Global Fetch Auth Interceptor
 * Injects Supabase JWT Bearer token into all outgoing requests to API_BASE_URL.
 */
let isInitialized = false;

export function setupAuthInterceptor() {
  if (typeof window === 'undefined' || isInitialized) return;

  const originalFetch = window.fetch;

  window.fetch = async function (resource, config = {}) {
    let url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : '';

    // Only intercept requests directed to our CRM backend API
    if (url && (url.startsWith(API_BASE_URL) || url.startsWith('/api') || url.includes('/api/v1'))) {
      const headers = new Headers(config.headers || (resource instanceof Request ? resource.headers : {}));

      // Fast path: if Authorization header is already provided, skip lookup
      if (headers.has('Authorization') || headers.has('authorization')) {
        return originalFetch.call(this, resource, { ...config, headers });
      }

      try {
        let token = localStorage.getItem('token');
        if (!token) {
          const { data } = await supabase.auth.getSession();
          token = data?.session?.access_token;
          if (token) {
            localStorage.setItem('token', token);
          }
        }

        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
          config = {
            ...config,
            headers,
          };
        }
      } catch (err) {
        console.warn('Auth interceptor session lookup note:', err);
      }
    }

    return originalFetch.call(this, resource, config);
  };

  isInitialized = true;
}
