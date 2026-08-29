import API from './api.js';

export const examAPI = {
  // ─── Public Exam ───
  getExams:               ()            => API.get('/exams'),
  getExamBySlug:          (slug)        => API.get(`/exams/${slug}`),
  getExamSyllabus:        (id)          => API.get(`/exams/${id}/syllabus`),
  getSubtopicsOfTopic:    (topicId)     => API.get(`/exams/topics/${topicId}/subtopics`),

  // ─── Admin: Exams ───
  getAllExamsAdmin:        ()            => API.get('/exams/admin/all'),
  createExam:             (data)        => API.post('/exams', data),
  updateExam:             (id, data)    => API.put(`/exams/${id}`, data),
  deleteExam:             (id)          => API.delete(`/exams/${id}`),

  // ─── Admin: Phases ───
  createPhase:            (examId, data) => API.post(`/exams/${examId}/phases`, data),
  updatePhase:            (id, data)    => API.put(`/exams/phases/${id}`, data),
  deletePhase:            (id)          => API.delete(`/exams/phases/${id}`),

  // ─── Admin: Subjects ───
  createSubject:          (examId, data) => API.post(`/exams/${examId}/subjects`, data),
  updateSubject:          (id, data)    => API.put(`/exams/subjects/${id}`, data),
  deleteSubject:          (id)          => API.delete(`/exams/subjects/${id}`),

  // ─── Admin: Topics ───
  createTopic:            (examId, data) => API.post(`/exams/${examId}/topics`, data),
  updateTopic:            (id, data)    => API.put(`/exams/topics/${id}`, data),
  deleteTopic:            (id)          => API.delete(`/exams/topics/${id}`),

  // ─── Admin: Subtopics ───
  createSubtopic:         (examId, data) => API.post(`/exams/${examId}/subtopics`, data),
  updateSubtopic:         (id, data)    => API.put(`/exams/subtopics/${id}`, data),
  deleteSubtopic:         (id)          => API.delete(`/exams/subtopics/${id}`),

  // ─── Admin: Publish / Archive Toggles ───
  togglePublish:          (nodeType, id) => API.patch(`/exams/${nodeType}/${id}/publish`),
  toggleArchive:          (nodeType, id) => API.patch(`/exams/${nodeType}/${id}/archive`),

  // ─── Admin: Syllabus Management (list/tree/stats) ───
  getSyllabusStats:       ()            => API.get('/admin/syllabus/stats'),
  getFullSyllabusTree:    (examId)      => API.get('/admin/syllabus/full-tree', { params: examId ? { examId } : {} }),
  listExams:              (params)      => API.get('/admin/syllabus/list/exams', { params }),
  listPhases:             (params)      => API.get('/admin/syllabus/list/phases', { params }),
  listSubjects:           (params)      => API.get('/admin/syllabus/list/subjects', { params }),
  listTopics:             (params)      => API.get('/admin/syllabus/list/topics', { params }),
  listSubtopics:          (params)      => API.get('/admin/syllabus/list/subtopics', { params }),
  importSyllabus:         (data)        => API.post('/admin/syllabus/import', data),
};

export default examAPI;

