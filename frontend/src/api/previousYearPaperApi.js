import API from './api.js';

export const previousYearPaperAPI = {
  // Aspirant APIs
  getPapers: (params) => API.get('/previous-year-papers', { params }),
  getPaperDetails: (id) => API.get(`/previous-year-papers/${id}`),
  startAttempt: (id) => API.post(`/previous-year-papers/${id}/start`),
  getAttemptDetails: (attemptId) => API.get(`/previous-year-papers/attempts/${attemptId}`),
  saveAnswer: (attemptId, data) => API.post(`/previous-year-papers/attempts/${attemptId}/save-answer`, data),
  markReview: (attemptId, data) => API.post(`/previous-year-papers/attempts/${attemptId}/mark-review`, data),
  submitAttempt: (attemptId) => API.post(`/previous-year-papers/attempts/${attemptId}/submit`),
  autoSubmitAttempt: (attemptId) => API.post(`/previous-year-papers/attempts/${attemptId}/auto-submit`),
  getAttemptResult: (attemptId) => API.get(`/previous-year-papers/attempts/${attemptId}/result`),
  getAttemptHistory: (params) => API.get('/previous-year-papers/attempt-history', { params }),

  // Admin APIs (Phase 8 Step 1 reference)
  adminCreatePaper: (data) => API.post('/admin/previous-year-papers', data),
  adminGetPapers: (params) => API.get('/admin/previous-year-papers', { params }),
  adminGetPaperById: (id) => API.get(`/admin/previous-year-papers/${id}`),
  adminUpdatePaper: (id, data) => API.put(`/admin/previous-year-papers/${id}`, data),
  adminDeletePaper: (id) => API.delete(`/admin/previous-year-papers/${id}`),
  adminAddQuestion: (id, data) => API.post(`/admin/previous-year-papers/${id}/questions`, data),
  adminRemoveQuestion: (id, qId) => API.delete(`/admin/previous-year-papers/${id}/questions/${qId}`),
  adminPublishPaper: (id, data) => API.patch(`/admin/previous-year-papers/${id}/publish`, data),
};

export default previousYearPaperAPI;
