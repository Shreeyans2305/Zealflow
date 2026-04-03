const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('zealflow_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let detail = 'Request failed';
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {}
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, data) => apiRequest(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => apiRequest(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (path, data) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),

  // Returns the full Response object (for streaming downloads like CSV)
  getRaw: (path) => {
    const token = localStorage.getItem('zealflow_token');
    return fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};
