import { supabase } from './supabaseClient';
import { API_BASE_URL } from './apiConfig';

/**
 * Authenticated API Client
 * Automatically attaches Supabase JWT Bearer token and standardizes response/error handling.
 */
class ApiClient {
  async getAuthToken() {
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('token');
      if (localToken) return localToken;
    }
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || null;
    } catch (err) {
      console.warn('Could not retrieve Supabase access token:', err);
      return null;
    }
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const token = await this.getAuthToken();

    const headers = {
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // If body is not FormData, set Content-Type JSON
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(url, config);

      // Handle 401 Unauthorized Session Expiry
      if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/')) {
        console.warn('Session expired or unauthorized request. Redirecting to login...');
      }

      const contentType = res.headers.get('content-type');
      let responseData = null;
      if (contentType && contentType.includes('application/json')) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }

      if (!res.ok) {
        const errorMessage = responseData?.error?.message || responseData?.message || responseData?.error || `HTTP ${res.status} Error`;
        const customError = new Error(errorMessage);
        customError.status = res.status;
        customError.code = responseData?.error?.code || 'API_ERROR';
        customError.details = responseData?.error?.details || [];
        customError.data = responseData;
        throw customError;
      }

      return responseData;
    } catch (err) {
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
