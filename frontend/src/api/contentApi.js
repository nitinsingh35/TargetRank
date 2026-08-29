import API from './api.js';

export const contentAPI = {
  // ── Legacy import endpoints (preserved) ──────────────────
  importCSV: (formData) => API.post('/content/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  importJSON: (formData) => API.post('/content/import/json', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getCSVTemplate: () => API.get('/content/import/template/csv', { responseType: 'blob' }),
  getJSONTemplate: () => API.get('/content/import/template/json', { responseType: 'blob' }),
  getImportBatches: () => API.get('/content/import/batches'),
  getImportBatchById: (id) => API.get(`/content/import/batches/${id}`),
  getReviewQueue: () => API.get('/questions/review-queue'),
  reviewQuestion: (id, data) => API.put(`/questions/${id}/review`, data),
  getContentCoverage: () => API.get('/content/coverage'),
  getCoverageGaps: () => API.get('/content/gaps'),

  // ── Content Intelligence Layer ─────────────────────────
  intelligence: {
    getCoverage:          (params = {}) => API.get('/content/intelligence/coverage', { params }),
    getHealth:            () => API.get('/content/intelligence/health'),
    getMissingContent:    (params = {}) => API.get('/content/intelligence/missing', { params }),
    buildMock:            (payload) => API.post('/content/intelligence/mock-builder', payload),
    getRecommendations:   (params = {}) => API.get('/content/intelligence/recommendations', { params }),
    getStatistics:        (params = {}) => API.get('/content/intelligence/statistics', { params }),
    getGrowthAnalytics:   (params = {}) => API.get('/content/intelligence/analytics/growth', { params }),
  },
};

export default contentAPI;

