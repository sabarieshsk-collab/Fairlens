const API_BASE_URL = (
  process.env.REACT_APP_API_URL ||
  process.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000')
).replace(/\/$/, '');


function getAuthHeaders() {
  const token = localStorage.getItem('fairlens_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeAudit(audit) {
  if (!audit) return null;

  return {
    ...audit,
    auditId: audit.auditId || audit._id,
    cycleName: audit.cycleName || audit.auditName || 'Unnamed Cycle',
    auditName: audit.auditName || audit.cycleName || 'Unnamed Cycle',
    processedAt: audit.processedAt || audit.createdAt,
    status: audit.status || audit.overallStatus || 'pending',
    stats: {
      total: 0,
      hired: 0,
      rejected: 0,
      hireRate: '0%',
      rejectedAtScreening: 0,
      rejectedAtTechnical: 0,
      unmatchedResumes: 0,
      hiredCandidates: [],
      rejectedCandidates: [],
      genderDistribution: { Female: 0, Male: 0 },
      collegeTierDistribution: { 'Tier 1': 0, 'Tier 2': 0, 'Tier 3': 0 },
      ...(audit.stats || {}),
    },
    fairnessMetrics: audit.fairnessMetrics || {},
    biasDrivers: audit.biasDrivers || [],
    allCandidates: audit.allCandidates || [],
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

// AUDITS API
export async function createAudit({ auditName, jobRole, department = '', csvFile = null, resumeFiles = [], candidateDetails = [] }) {
  let csvText = '';
  let csvFileName = '';

  if (csvFile) {
    csvText = typeof csvFile === 'string' ? csvFile : await csvFile.text();
    csvFileName = typeof csvFile === 'string' ? '' : (csvFile.name || 'decisions.csv');
  }

  const resumeFileNames = resumeFiles.map((file) => (typeof file === 'string' ? file : file?.name)).filter(Boolean);

  const payload = await request('/api/audits', {
    method: 'POST',
    body: JSON.stringify({
      auditName,
      jobRole,
      department,
      csvText,
      csvFileName,
      resumeFileNames,
      candidateDetails,
    }),
  });

  return normalizeAudit(payload);
}

export async function getAudits() {
  const audits = await request('/api/audits');
  return Array.isArray(audits) ? audits.map(normalizeAudit) : [];
}

export async function getLatestAudit() {
  const audit = await request('/api/audits/latest');
  return normalizeAudit(audit);
}

export async function getAuditById(id) {
  const audit = await request(`/api/audits/${id}`);
  return normalizeAudit(audit);
}

export async function duplicateAudit(id) {
  const audit = await request(`/api/audits/${id}/duplicate`, {
    method: 'POST',
  });
  return normalizeAudit(audit);
}

export async function deleteAudit(id) {
  return request(`/api/audits/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteAllAudits() {
  return request('/api/audits/all', {
    method: 'DELETE',
  });
}

// MONITORING API
export async function getMonitoringData() {
  return request('/api/monitoring');
}

export async function getMonitoringTrends(period = '6months') {
  return request(`/api/monitoring/trends?period=${period}`);
}

// COMPLIANCE REPORTS API
export async function getReports() {
  return request('/api/reports');
}

export async function generateReport({ auditId, type = 'ai_fairness', format = 'pdf' }) {
  return request('/api/reports/generate', {
    method: 'POST',
    body: JSON.stringify({ auditId, type, format }),
  });
}

export async function getReportById(id) {
  return request(`/api/reports/${id}`);
}

export async function downloadReport(id) {
  return request(`/api/reports/${id}/download`);
}

export async function downloadReportPdf(auditId = 'latest') {
  const token = localStorage.getItem('fairlens_token');
  const response = await fetch(`${API_BASE_URL}/api/reports/pdf/${auditId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No report available to export.');
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error('No report available to export.');
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'FairLens_Compliance_Report.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadReportCsv(auditId = 'latest') {
  const token = localStorage.getItem('fairlens_token');
  const response = await fetch(`${API_BASE_URL}/api/reports/csv/${auditId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No report available to export.');
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error('No report available to export.');
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'FairLens_Report.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadReportJson(auditId = 'latest') {
  const token = localStorage.getItem('fairlens_token');
  const response = await fetch(`${API_BASE_URL}/api/reports/json/${auditId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No report available to export.');
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error('No report available to export.');
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'FairLens_Report.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteReport(id) {
  return request(`/api/reports/${id}`, {
    method: 'DELETE',
  });
}

// NOTIFICATIONS API
export async function getNotifications(unreadOnly = false) {
  return request(`/api/notifications?unreadOnly=${unreadOnly}`);
}

export async function markNotificationAsRead(id) {
  return request(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead() {
  return request('/api/notifications/read-all', {
    method: 'PATCH',
  });
}

export async function deleteNotification(id) {
  return request(`/api/notifications/${id}`, {
    method: 'DELETE',
  });
}

// SEARCH API
export async function globalSearch(query) {
  return request(`/api/search?q=${encodeURIComponent(query)}`);
}

// SETTINGS API
export async function getProfile() {
  return request('/api/settings/profile');
}

export async function updateProfile({ companyName, email }) {
  return request('/api/settings/profile', {
    method: 'PATCH',
    body: JSON.stringify({ companyName, email }),
  });
}

export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  return request('/api/settings/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
}

export async function updateNotificationPreferences(preferences) {
  return request('/api/settings/notifications/preferences', {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  });
}

export async function deleteAccount({ password, confirmation }) {
  return request('/api/settings/account', {
    method: 'DELETE',
    body: JSON.stringify({ password, confirmation }),
  });
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}