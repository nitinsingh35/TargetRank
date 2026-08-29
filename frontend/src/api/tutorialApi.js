import API from './api.js';

export const tutorialAPI = {
  // Admin Endpoints
  adminCreate: (data) => API.post('/admin/tutorials', data),
  adminGetAll: (params) => API.get('/admin/tutorials', { params }),
  adminGetById: (id) => API.get(`/admin/tutorials/${id}`),
  adminUpdate: (id, data) => API.put(`/admin/tutorials/${id}`, data),
  adminPublish: (id) => API.post(`/admin/tutorials/${id}/publish`),
  adminArchive: (id) => API.post(`/admin/tutorials/${id}/archive`),
  adminDelete: (id) => API.delete(`/admin/tutorials/${id}`),

  // Aspirant/Student Endpoints
  getTutorials: (params) => API.get('/tutorials', { params }),
  getTutorialById: (id) => API.get(`/tutorials/${id}`),
  getRecommended: () => API.get('/tutorials/recommended'),
  getMyProgress: () => API.get('/tutorials/my-progress'),
  updateProgress: (id, data) => API.post(`/tutorials/${id}/progress`, data),
};

export default tutorialAPI;
