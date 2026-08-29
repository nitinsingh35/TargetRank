import API from './api.js';

export const mockTestAPI = {
  // Aspirant APIs
  getMockTests: (params) => API.get('/mock-tests', { params }),
  getMockTest: (id) => API.get(`/mock-tests/${id}`),
  startAttempt: (id, data) => API.post(`/mock-tests/${id}/start`, data),
  getAttempt: (attemptId) => API.get(`/mock-tests/attempts/${attemptId}`),
  saveAnswer: (attemptId, data) => API.post(`/mock-tests/attempts/${attemptId}/save-answer`, data),
  markReview: (attemptId, data) => API.post(`/mock-tests/attempts/${attemptId}/mark-review`, data),
  bookmark: (attemptId, data) => API.post(`/mock-tests/attempts/${attemptId}/bookmark`, data),
  submitAttempt: (attemptId, data) => API.post(`/mock-tests/attempts/${attemptId}/submit`, data),
  autoSubmitAttempt: (attemptId, data) => API.post(`/mock-tests/attempts/${attemptId}/auto-submit`, data),
  getResult: (attemptId) => API.get(`/mock-tests/attempts/${attemptId}/result`),
  getMyAttempts: (params) => API.get('/mock-tests/my-attempts', { params }),

  // Admin moderation APIs
  adminGetTemplates: () => API.get('/admin/mock-tests/templates'),
  adminCreateMockTest: (data) => API.post('/admin/mock-tests', data),
  adminGetMockTests: (params) => API.get('/admin/mock-tests', { params }),
  adminGetMockTest: (id) => API.get(`/admin/mock-tests/${id}`),
  adminUpdateMockTest: (id, data) => API.put(`/admin/mock-tests/${id}`, data),
  adminDeleteMockTest: (id) => API.delete(`/admin/mock-tests/${id}`),
  adminPreviewAvailability: (id) => API.post(`/admin/mock-tests/${id}/preview-availability`),
  adminPublishMockTest: (id, data) => API.post(`/admin/mock-tests/${id}/publish`, data),
  adminArchiveMockTest: (id) => API.post(`/admin/mock-tests/${id}/archive`),
  adminDuplicateMockTest: (id) => API.post(`/admin/mock-tests/${id}/duplicate`),
  adminGetAnalytics: (id) => API.get(`/admin/mock-tests/${id}/analytics`),
};

export default mockTestAPI;
