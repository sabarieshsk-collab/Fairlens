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

function normalizeAudit(audit) {
  if (!audit) return null;

  return {
    ...audit,
    auditId: audit.auditId || audit._id,
    cycleName: audit.cycleName || audit.auditName || 'Unnamed Cycle',
    auditName: audit.auditName || audit.cycleName || 'Unnamed Cycle',
    processedAt: audit.processedAt || audit.createdAt,
    status: audit.status || audit.overallStatus || 'pending',
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
    console.error(`[API Error] ${path}:`, error.message);
    throw error;
  }
}

export async function createAudit(auditData) {
  const data = await request('/api/audits', {
    method: 'POST',
    body: JSON.stringify(auditData),
  });
  return normalizeAudit(data);
}

export async function getAudits() {
  const list = await request('/api/audits');
  return (list || []).map(normalizeAudit);
}

export async function getLatestAudit() {
  const data = await request('/api/audits/latest');
  return normalizeAudit(data);
}

export async function getAuditById(auditId) {
  const data = await request(`/api/audits/${auditId}`);
  return normalizeAudit(data);
}

export async function duplicateAudit(auditId) {
  const data = await request(`/api/audits/${auditId}/duplicate`, {
    method: 'POST',
  });
  return normalizeAudit(data);
}

export async function deleteAudit(auditId) {
  return await request(`/api/audits/${auditId}`, {
    method: 'DELETE',
  });
}

export async function deleteAllAudits() {
  return await request('/api/audits', {
    method: 'DELETE',
  });
}

export async function getReports() {
  return await request('/api/reports');
}

export async function generateReport(reportParams) {
  return await request('/api/reports/generate', {
    method: 'POST',
    body: JSON.stringify(reportParams),
  });
}

export async function getReportById(reportId) {
  return await request(`/api/reports/${reportId}`);
}

export async function downloadReport(reportId) {
  const token = localStorage.getItem('fairlens_token');
  const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/download`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download report PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FairLens_Report_${reportId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
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

export async function deleteReport(reportId) {
  return await request(`/api/reports/${reportId}`, {
    method: 'DELETE',
  });
}

export async function globalSearch(query) {
  if (!query) return { audits: [], candidates: [] };
  return await request(`/api/search?q=${encodeURIComponent(query)}`).catch(() => ({ audits: [], candidates: [] }));
}

export async function getNotifications() {
  return await request('/api/notifications').catch(() => []);
}

export async function markNotificationRead(id) {
  return await request(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => ({}));
}

export async function markNotificationAsRead(id) {
  return await markNotificationRead(id);
}

export async function markAllNotificationsAsRead() {
  return await request('/api/notifications/read-all', { method: 'PATCH' }).catch(() => ({}));
}

export async function getMonitoringStats() {
  return await request('/api/monitoring').catch(() => ({}));
}

export async function getMonitoringData() {
  return await getMonitoringStats();
}

export async function getSettings() {
  return await request('/api/settings').catch(() => ({}));
}

export async function updateSettings(settingsData) {
  return await request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settingsData),
  });
}