const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const setToken = (token) => localStorage.setItem('sr_token', token);
export const getToken = () => localStorage.getItem('sr_token');
export const removeToken = () => localStorage.removeItem('sr_token');

export const setLoggedIn = (val) => localStorage.setItem('sr_logged_in', val ? 'true' : 'false');
export const isLoggedIn = () => localStorage.getItem('sr_logged_in') === 'true';

export const getDeviceId = () => {
  let id = localStorage.getItem('sr_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('sr_device_id', id);
  }
  return id;
};

async function request(endpoint, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'X-Device-Id': getDeviceId(),
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      removeToken();
      setLoggedIn(false);
      window.location.href = '/#/signin';
    }
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
      ...options
    });
  },
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options })
};
