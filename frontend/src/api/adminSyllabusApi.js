import API from './api.js';

export const adminSyllabusAPI = {
  getSyllabusTree: () => API.get('/admin/syllabus/tree'),
  importSyllabus: (data) => API.post('/admin/syllabus/import', data),
  updateTopicSettings: (id, data) => API.put(`/admin/syllabus/topics/${id}`, data),
  getSyllabusCoverage: (params) => API.get('/admin/syllabus/coverage', { params }),
};

export default adminSyllabusAPI;
