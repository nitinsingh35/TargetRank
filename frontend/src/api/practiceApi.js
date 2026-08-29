import API from './api.js';

export const practiceAPI = {
  // Config
  getConfig: (examId, phaseId) => API.get(`/practice/config/${examId}/${phaseId}`),

  // Session creation and management
  createSmartSession: (data) => API.post('/practice/create-smart-session', data),
  getSessionDetails: (id) => API.get(`/practice/sessions/${id}`),
  saveAnswer: (id, data) => API.post(`/practice/sessions/${id}/save-answer`, data),
  submitSession: (id) => API.post(`/practice/sessions/${id}/submit`),
  getSessionResult: (id) => API.get(`/practice/sessions/${id}/result`),
  abandonSession: (id) => API.post(`/practice/sessions/${id}/abandon`),
  deleteSession: (id) => API.delete(`/practice/sessions/${id}`),

  // User sessions
  getMySessions: (page = 1, limit = 10) => API.get('/practice/my-sessions', { params: { page, limit } }),
  getHistory: () => API.get('/practice/history'),
  getRecommendations: () => API.get('/practice/recommendations'),

  // Question availability
  getAvailableQuestionCount: (params) => API.get('/practice/available-question-count', { params }),
};

export default practiceAPI;
