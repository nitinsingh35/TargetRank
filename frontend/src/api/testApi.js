import API from './api.js';

export const testAPI = {
  getMockTests: (params) => API.get('/tests', { params }),
  getMockTestById: (id) => API.get(`/tests/${id}`),
  startAttempt: (id) => API.post(`/tests/${id}/start`),
  saveAttemptProgress: (attemptId, data) => API.post(`/tests/attempts/${attemptId}/save`, data),
  submitAttempt: (attemptId) => API.post(`/tests/attempts/${attemptId}/submit`),
  getAttemptResult: (attemptId) => API.get(`/tests/attempts/${attemptId}/result`),
  generateCustomPractice: (data) => API.post('/tests/custom-practice', data),

  // Moderation CRUD
  createMockTest: (data) => API.post('/tests', data),
  updateMockTest: (id, data) => API.put(`/tests/${id}`, data),
  deleteMockTest: (id) => API.delete(`/tests/${id}`),
};

export default testAPI;
