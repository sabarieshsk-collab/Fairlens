const API_BASE_URL = (
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000')
).replace(/\/$/, '');


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

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const message = typeof payload === 'string' ? payload : payload?.message || 'Request failed';
      throw new Error(message);
    }

    return payload;
  } catch (err) {
    if (err.name === 'TypeError' && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      throw new Error(`Unable to connect to backend server at ${API_BASE_URL}. Please ensure the backend process (node server.js) is running.`);
    }
    throw err;
  }
}

export async function registerCompany({ companyName, email, password, confirmPassword }) {
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ companyName, email, password, confirmPassword }),
  });
  
  if (response.token) {
    localStorage.setItem('fairlens_token', response.token);
    localStorage.setItem('fairlens_company', JSON.stringify(response.company));
  }
  
  return response;
}

export async function loginCompany(email, password) {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (response.token) {
    localStorage.setItem('fairlens_token', response.token);
    localStorage.setItem('fairlens_company', JSON.stringify(response.company));
  }
  
  return response;
}

export async function googleLoginCompany(idToken, userData = {}) {
  const response = await request('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      idToken,
      name: userData.name,
      email: userData.email,
      photoURL: userData.photoURL,
      uid: userData.uid,
    }),
  });

  if (response.token) {
    localStorage.setItem('fairlens_token', response.token);
    localStorage.setItem('fairlens_company', JSON.stringify(response.company));
  }

  return response;
}

export async function verifyToken() {
  const response = await request('/api/auth/verify');
  return response;
}

export function logout() {
  localStorage.removeItem('fairlens_token');
  localStorage.removeItem('fairlens_company');
}

export function getCompany() {
  try {
    const data = localStorage.getItem('fairlens_company');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem('fairlens_token');
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}