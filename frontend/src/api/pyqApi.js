import API from './api.js';

export const pyqAPI = {
  // Aspirant APIs
  getPYQPapers: (params) => API.get('/pyq-papers', { params }),
  getPYQPaper: (id) => API.get(`/pyq-papers/${id}`),
  startAttempt: (id) => API.post(`/pyq-papers/${id}/start`),
  getAttempt: (attemptId) => API.get(`/pyq-papers/attempts/${attemptId}`),
  saveAnswer: (attemptId, data) => API.post(`/pyq-papers/attempts/${attemptId}/save-answer`, data),
  markReview: (attemptId, data) => API.post(`/pyq-papers/attempts/${attemptId}/mark-review`, data),
  bookmark: (attemptId, data) => API.post(`/pyq-papers/attempts/${attemptId}/bookmark`, data),
  submitAttempt: (attemptId) => API.post(`/pyq-papers/attempts/${attemptId}/submit`),
  autoSubmitAttempt: (attemptId) => API.post(`/pyq-papers/attempts/${attemptId}/auto-submit`),
  getResult: (attemptId) => API.get(`/pyq-papers/attempts/${attemptId}/result`),
  getMyAttempts: (params) => API.get('/pyq-papers/my-attempts', { params }),
  getMyComparison: (params) => API.get('/pyq-papers/my-comparison', { params }),

  // Admin APIs
  adminCreatePYQPaper: (data) => API.post('/admin/pyq-papers', data),
  adminGetPYQPapers: (params) => API.get('/admin/pyq-papers', { params }),
  adminGetPYQPaper: (id) => API.get(`/admin/pyq-papers/${id}`),
  adminUpdatePYQPaper: (id, data) => API.put(`/admin/pyq-papers/${id}`, data),
  adminDeletePYQPaper: (id) => API.delete(`/admin/pyq-papers/${id}`),
  adminValidatePYQPaper: (id) => API.post(`/admin/pyq-papers/${id}/validate`),
  adminPublishPYQPaper: (id) => API.post(`/admin/pyq-papers/${id}/publish`),
  adminArchivePYQPaper: (id) => API.post(`/admin/pyq-papers/${id}/archive`),
  adminDuplicatePYQPaper: (id) => API.post(`/admin/pyq-papers/${id}/duplicate`),
  adminGetAnalytics: (id) => API.get(`/admin/pyq-papers/${id}/analytics`),
};

export default pyqAPI;
