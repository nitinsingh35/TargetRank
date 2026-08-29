import API from '../services/api.js';

// ── Auth endpoints ─────────────────────────────────
export const authAPI = {
  register:      (data)   => API.post('/auth/register', data),
  login:         (data)   => API.post('/auth/login', data),
  logout:        ()       => API.post('/auth/logout'),
  getMe:         ()       => API.get('/auth/me'),
  updateProfile: (data)   => API.put('/auth/profile', data),
};

// ── Exam & Syllabus endpoints ──────────────────────
export const examAPI = {
  getExams:           (params) => API.get('/exams', { params }),
  getExamById:        (id)     => API.get(`/exams/${id}`),
  getExamSyllabus:    (id, params) => API.get(`/exams/${id}/syllabus`, { params }),
  searchTopics:       (params) => API.get('/exams/search/topics', { params }),
  createExam:         (data)   => API.post('/exams', data),
  updateExam:         (id, data) => API.put(`/exams/${id}`, data),
  deleteExam:         (id)     => API.delete(`/exams/${id}`),
  createPhase:        (examId, data) => API.post(`/exams/${examId}/phases`, data),
  updatePhase:        (phaseId, data) => API.put(`/exams/phases/${phaseId}`, data),
  deletePhase:        (phaseId) => API.delete(`/exams/phases/${phaseId}`),
  createSubject:      (examId, phaseId, data) => API.post(`/exams/${examId}/phases/${phaseId}/subjects`, data),
  updateSubject:      (subjectId, data) => API.put(`/exams/subjects/${subjectId}`, data),
  deleteSubject:      (subjectId) => API.delete(`/exams/subjects/${subjectId}`),
  createTopic:        (examId, phaseId, subjectId, data) => API.post(`/exams/${examId}/phases/${phaseId}/subjects/${subjectId}/topics`, data),
  updateTopic:        (topicId, data) => API.put(`/exams/topics/${topicId}`, data),
  deleteTopic:        (topicId) => API.delete(`/exams/topics/${topicId}`),
};

export const dashboardAPI = {
  getAdminStats:   () => API.get('/admin/dashboard'),
  getMentorStats:  () => API.get('/mentor/dashboard'),
  getAspirantStats:() => API.get('/aspirant/dashboard'),
};

export default API;
