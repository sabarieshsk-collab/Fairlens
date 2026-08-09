const getApiBaseUrl = () => {
  let url = '';
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    url = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '';
  }
  if (!url && typeof process !== 'undefined' && process.env) {
    url = process.env.VITE_API_URL || process.env.REACT_APP_API_URL || '';
  }
  if (!url) {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      url = 'http://localhost:5000';
    } else {
      url = 'https://fairlens-863f.onrender.com';
    }
  }
  return url.replace(/\/$/, '');
};

const API_BASE_URL = getApiBaseUrl();

function getAuthHeaders() {
  const token = localStorage.getItem('fairlens_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: getAuthHeaders(),
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[Auth API Error] ${path}:`, error.message);
    throw error;
  }
}

export async function loginCompany(emailOrCredentials, password) {
  let payload;
  if (typeof emailOrCredentials === 'object' && emailOrCredentials !== null) {
    payload = emailOrCredentials;
  } else {
    payload = { email: emailOrCredentials, password };
  }

  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (data?.token) {
    localStorage.setItem('fairlens_token', data.token);
  }
  if (data?.company) {
    localStorage.setItem('fairlens_company', JSON.stringify(data.company));
  }

  return data;
}

export async function registerCompany(companyData) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(companyData),
  });

  if (data?.token) {
    localStorage.setItem('fairlens_token', data.token);
  }
  if (data?.company) {
    localStorage.setItem('fairlens_company', JSON.stringify(data.company));
  }

  return data;
}

export async function googleLoginCompany(idToken, userInfo = {}) {
  const data = await request('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      idToken,
      userInfo,
      email: userInfo.email,
      name: userInfo.name || userInfo.displayName || '',
      photoURL: userInfo.photoURL || userInfo.picture || '',
      uid: userInfo.uid || '',
      companyName: userInfo.name || userInfo.displayName || userInfo.email?.split('@')[0] || 'Google User',
    }),
  });

  if (data?.token) {
    localStorage.setItem('fairlens_token', data.token);
  }
  if (data?.company) {
    localStorage.setItem('fairlens_company', JSON.stringify(data.company));
  }

  return data;
}

export async function verifyToken() {
  const token = localStorage.getItem('fairlens_token');
  if (!token) return null;

  try {
    const data = await request('/api/auth/verify');
    return data?.company || data?.user || null;
  } catch (error) {
    localStorage.removeItem('fairlens_token');
    return null;
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem('fairlens_token');
}

export function getCompany() {
  try {
    const raw = localStorage.getItem('fairlens_company');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse cached company from localStorage:', err.message);
    localStorage.removeItem('fairlens_company');
    return null;
  }
}

export function logoutCompany() {
  localStorage.removeItem('fairlens_token');
  localStorage.removeItem('fairlens_company');
  localStorage.removeItem('fairlens_user');
  return { success: true };
}

export function logout() {
  return logoutCompany();
}