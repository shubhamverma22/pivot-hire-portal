const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('pivothire_token');
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('pivothire_token', token);
    else localStorage.removeItem('pivothire_token');
  }

  getToken() {
    return this.token || localStorage.getItem('pivothire_token');
  }

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (res.status === 204) return null;

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = data?.detail || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return data;
  }

  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); }
  patch(path, body) { return this.request(path, { method: 'PATCH', body: JSON.stringify(body) }); }
  delete(path) { return this.request(path, { method: 'DELETE' }); }
}

const api = new ApiClient();

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  registerFounder: (data) => api.post('/auth/register/founder', data),
  registerCompany: (data) => api.post('/auth/register/company', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  me: () => api.get('/auth/me'),
};

// ── Profiles ────────────────────────────────────────────────────────────────
export const profileApi = {
  getFounderProfile: () => api.get('/profile/founder'),
  updateFounderProfile: (data) => api.put('/profile/founder', data),
  getCompanyProfile: () => api.get('/profile/company'),
  updateCompanyProfile: (data) => api.put('/profile/company', data),
  getCompanyPublic: (userId) => api.get(`/profile/company/${userId}`),
};

// ── Jobs ────────────────────────────────────────────────────────────────────
export const jobsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.role_type) qs.set('role_type', params.role_type);
    if (params.location) qs.set('location', params.location);
    if (params.skip) qs.set('skip', params.skip);
    if (params.limit) qs.set('limit', params.limit);
    const q = qs.toString();
    return api.get(`/jobs${q ? '?' + q : ''}`);
  },
  get: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.patch(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  myPostings: () => api.get('/jobs/my/postings'),
};

// ── Applications ────────────────────────────────────────────────────────────
export const applicationsApi = {
  apply: (data) => api.post('/applications', data),
  myApplications: (status) => {
    const qs = status ? `?status=${status}` : '';
    return api.get(`/applications/my${qs}`);
  },
  jobApplications: (jobId, params = {}) => {
    const qs = new URLSearchParams();
    if (params.skill) qs.set('skill', params.skill);
    if (params.location) qs.set('location', params.location);
    if (params.experience_min) qs.set('experience_min', params.experience_min);
    if (params.status) qs.set('status', params.status);
    const q = qs.toString();
    return api.get(`/applications/job/${jobId}${q ? '?' + q : ''}`);
  },
  update: (id, data) => api.patch(`/applications/${id}`, data),
};

// ── Subscription ────────────────────────────────────────────────────────────
export const subscriptionApi = {
  get: () => api.get('/subscription'),
  checkout: (data = {}) => api.post('/subscription/checkout', data),
  cancel: () => api.post('/subscription/cancel'),
};

// ── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  founder: () => api.get('/dashboard/founder'),
  company: () => api.get('/dashboard/company'),
};

export default api;
