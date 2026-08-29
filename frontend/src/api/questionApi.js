import API from './api.js';

export const questionAPI = {
  getQuestions: (params) => API.get('/questions', { params }),
  createQuestion: (data) => API.post('/questions', data),
  updateQuestion: (id, data) => API.put(`/questions/${id}`, data),
  deleteQuestion: (id) => API.delete(`/questions/${id}`),
  reviewQuestion: (id, status) => API.post(`/questions/${id}/review`, { status }),
  toggleBookmark: (id) => API.post(`/questions/${id}/bookmark`),
  getBookmarks: () => API.get('/questions/bookmarks'),

  // File upload for CSV bulk upload
  bulkUpload: (formData) => API.post('/questions/bulk-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),

  // Admin QCMS Endpoints
  getLibraryStats: () => API.get('/admin/questions/library/stats'),
  listLibraryQuestions: (params) => API.get('/admin/questions/library/list', { params }),
  getLibraryAnalytics: () => API.get('/admin/questions/library/analytics'),
  bulkOperations: (data) => API.post('/admin/questions/library/bulk-update', data),
};

export default questionAPI;
