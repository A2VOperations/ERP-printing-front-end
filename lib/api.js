/**
 * Unified API Client for Next.js Frontend
 */
import { supabase } from './supabaseClient';

const defaultUrl = 'https://erp-printing-back-end.onrender.com';
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || defaultUrl;
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const API_BASE_URL = cleanBaseUrl.endsWith('/api/v1') ? cleanBaseUrl : `${cleanBaseUrl}/api/v1`;

export async function getAuthToken() {
  if (typeof window === 'undefined') return null;
  let storedToken = localStorage.getItem('token');
  if (storedToken) return storedToken;

  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || null;
    if (token) {
      localStorage.setItem('token', token);
      return token;
    }
  } catch (err) {
    // Suppress session error
  }

  // Fallback: check Supabase local storage keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase.auth.')) && key.endsWith('-auth-token')) {
        const parsed = JSON.parse(localStorage.getItem(key) || '{}');
        if (parsed?.access_token) {
          localStorage.setItem('token', parsed.access_token);
          return parsed.access_token;
        }
      }
    }
  } catch (err) {
    // Suppress parse error
  }

  return null;
}

// Global active request tracker for UI buffering and progress feedback
const requestListeners = new Set();
let activeRequestsCount = 0;

function notifyRequestState(isLoading, method, endpoint) {
  if (typeof window === 'undefined') return;
  const state = {
    activeRequests: activeRequestsCount,
    isLoading: activeRequestsCount > 0,
    currentMethod: method,
    currentEndpoint: endpoint,
  };
  requestListeners.forEach((listener) => {
    try {
      listener(state);
    } catch (e) {}
  });
  window.dispatchEvent(new CustomEvent('crm:api-loading', { detail: state }));
}

export function subscribeToApiLoading(callback) {
  requestListeners.add(callback);
  return () => requestListeners.delete(callback);
}

export function getActiveRequestsCount() {
  return activeRequestsCount;
}

export async function fetchApi(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const token = await getAuthToken();

  // If unauthenticated and on protected dashboard route, redirect to login cleanly
  if (!token && typeof window !== 'undefined' && !window.location.pathname.startsWith('/proof') && window.location.pathname !== '/') {
    window.location.href = '/';
    throw new Error('Authentication required. Redirecting to login...');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // If body is FormData, delete Content-Type to allow browser boundary calculation
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // Normalize endpoint to guarantee /api/v1 prefix
  let url = '';
  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else if (endpoint.startsWith('/api/v1/')) {
    url = `${cleanBaseUrl}${endpoint}`;
  } else {
    url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  activeRequestsCount++;
  notifyRequestState(true, method, endpoint);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/proof') && window.location.pathname !== '/') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      throw new Error('Session expired. Redirecting to login...');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || data.error?.message || data.error || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (!options?.silent) {
      console.error(`[API Error] ${endpoint}:`, err.message || err);
    }
    throw err;
  } finally {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    notifyRequestState(activeRequestsCount > 0, method, endpoint);
  }
}

export async function downloadPdf(endpoint, filename = 'document.pdf') {
  try {
    const token = await getAuthToken();
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to download PDF');
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error(`[Download Error] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  get: (endpoint, options) => fetchApi(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    fetchApi(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  put: (endpoint, body, options) =>
    fetchApi(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  patch: (endpoint, body, options) =>
    fetchApi(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  delete: (endpoint, options) => fetchApi(endpoint, { method: 'DELETE', ...options }),
  downloadPdf,
};
