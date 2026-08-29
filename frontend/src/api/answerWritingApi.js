import API from './api.js';

export const answerWritingAPI = {
  // Aspirant APIs
  getQuestions: (params) => API.get('/answer-writing/questions', { params }),
  getQuestionById: (id) => API.get(`/answer-writing/questions/${id}`),
  getAnalytics: () => API.get('/answer-writing/analytics'),
  createSubmission: (data) => API.post('/answer-writing/submissions', data),
  saveDraft: (id, data) => API.put(`/answer-writing/submissions/${id}/draft`, data),
  submitAnswer: (id) => API.post(`/answer-writing/submissions/${id}/submit`),
  getSubmissionHistory: (params) => API.get('/answer-writing/submissions', { params }),
  getSubmissionById: (id) => API.get(`/answer-writing/submissions/${id}`),
  toggleBookmark: (id) => API.post(`/answer-writing/submissions/${id}/bookmark`),

  // Mentor & Admin APIs
  mentorGetSubmissions: (params) => API.get('/mentor/answer-submissions', { params }),
  adminAssignMentor: (id, data) => API.post(`/mentor/answer-submissions/${id}/assign`, data),
  mentorReviewAnswer: (id, data) => API.post(`/mentor/answer-submissions/${id}/review`, data),
  mentorReturnAnswer: (id, data) => API.post(`/mentor/answer-submissions/${id}/return`, data),
};

export default answerWritingAPI;
